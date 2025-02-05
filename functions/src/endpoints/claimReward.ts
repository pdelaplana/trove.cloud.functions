import { allowedMethods } from '@src/shared/helpers/allowedMethods';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { hydrateLoyaltyCardTransaction } from '@src/shared/helpers/hydrateLoyaltyCardTransaction';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';
import {
  createCustomerReward,
  createLoyaltyCardTransaction,
  deleteLoyaltyCardTransaction,
  updateLoyaltyCard,
} from '@src/shared/mutations';
import {
  fetchBusinessById,
  fetchCustomerById,
  fetchLoyaltyCardByMembershipNumber,
  fetchLoyaltyProgramMilestoneById,
} from '@src/shared/queries';
import { onRequest } from 'firebase-functions/v2/https';

export const claimReward = onRequest(async (request, response) => {
  allowedMethods(request, response, ['POST']);

  const { membershipNumber, loyaltyProgramMilestoneId } = request.body;

  beginTimedOperation(
    'claimReward',
    { membershipNumber, loyaltyProgramMilestoneId },
    async () => {
      runWithAuthentication(request, response, async (context) => {
        const { businessId } = context;
        const loyaltyCard =
          await fetchLoyaltyCardByMembershipNumber(membershipNumber);
        if (!loyaltyCard) {
          response.status(404).send({ error: 'Loyalty card not found.' });
          return;
        }
        if (loyaltyCard.businessId !== businessId) {
          response
            .status(403)
            .send({ error: 'Loyalty card does not belong to this business.' });
          return;
        }

        const loyaltyProgramMilestone = await fetchLoyaltyProgramMilestoneById(
          loyaltyProgramMilestoneId,
          loyaltyCard.loyaltyProgramId,
          businessId
        );

        if (!loyaltyProgramMilestone) {
          response.status(404).send({ error: 'Milestone not found.' });
          return;
        }

        if (loyaltyCard.points < loyaltyProgramMilestone.points) {
          response
            .status(403)
            .send({ error: 'Insufficient points to claim this reward' });
          return;
        }

        // add the reward to the loyalty card
        const rewardId = await createCustomerReward(
          loyaltyCard.businessId,
          loyaltyCard.id,
          loyaltyProgramMilestone.reward
        );

        if (rewardId !== null) {
          // create the transaction

          const business = await fetchBusinessById(businessId);
          const customer = await fetchCustomerById(loyaltyCard.customerId);

          // create and hydrate the transaction
          const transaction = hydrateLoyaltyCardTransaction(
            loyaltyCard,
            customer,
            business
          );

          transaction.transactionType = 'redeem';
          transaction.redeemedPoints = loyaltyProgramMilestone.points;

          transaction.totalPoints =
            transaction.earnedPoints +
            transaction.bonusPoints -
            transaction.redeemedPoints;

          let transactionId = '';
          try {
            // create the transaction
            transactionId = await createLoyaltyCardTransaction(transaction);

            if (transactionId) {
              loyaltyCard.points -= loyaltyProgramMilestone.points;
              updateLoyaltyCard(loyaltyCard);
            }
          } catch (error) {
            if (!transactionId)
              deleteLoyaltyCardTransaction(businessId, transactionId);
            response.status(500).send({ error: 'Error claiming reward' });
            return;
          }
        }

        response.status(200).send({ message: 'Reward claimed', rewardId });
      });
    }
  );
});
