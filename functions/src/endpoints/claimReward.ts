import { processRedemption } from '@src/domain/operations/processRedemption';
import {
  createFirebaseEventBus,
  setupRewardEventHandlers,
} from '@src/eventBus';
import { allowedMethods } from '@src/shared/helpers/allowedMethods';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';
import {
  fetchBusinessById,
  fetchCustomerById,
  fetchLoyaltyCardByMembershipNumber,
  fetchLoyaltyCardTransactionById,
  fetchLoyaltyProgramMilestoneById,
} from '@src/shared/queries';
import { fetchCustomerRewardId } from '@src/shared/queries/fetchCustomerRewardId';
import { logger } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

export const claimReward = onRequest(async (request, response) => {
  allowedMethods(request, response, ['POST']);

  const { membershipNumber, loyaltyProgramMilestoneId } = request.body;

  const eventBus = createFirebaseEventBus();
  setupRewardEventHandlers(eventBus);

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
        logger.debug('Loyalty card found', { loyaltyCard });
        if (loyaltyCard.businessId !== businessId) {
          response
            .status(403)
            .send({ error: 'Loyalty card does not belong to this business.' });
          return;
        }

        const [business, customer, loyaltyProgramMilestone] = await Promise.all(
          [
            fetchBusinessById(businessId),
            fetchCustomerById(loyaltyCard.customerId),
            fetchLoyaltyProgramMilestoneById(
              loyaltyProgramMilestoneId,
              loyaltyCard.loyaltyProgramId,
              businessId
            ),
          ]
        );

        if (!loyaltyProgramMilestone) {
          response.status(404).send({ error: 'Milestone not found.' });
          return;
        }

        const { success, error, data } = await processRedemption(
          {
            loyaltyCard,
            customer,
            business,
            loyaltyProgramMilestone,
            transactionType: 'redeem',
          },
          eventBus
        );

        if (!success || !data) {
          response.status(500).send({ error: error });
          return;
        }

        response.status(200).send({
          message: 'Reward claimed',
          reward: await fetchCustomerRewardId(
            data.rewardId,
            businessId,
            loyaltyCard.id
          ),
          transaction: await fetchLoyaltyCardTransactionById(
            data.transactionId,
            businessId
          ),
        });
      });
    }
  );
});
