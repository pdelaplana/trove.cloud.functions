import { processClaimReward } from '@src/domain/operations';
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
import { fetchCustomerRewardById } from '@src/shared/queries/fetchCustomerRewardById';
import { fetchCustomerRewards } from '@src/shared/queries/fetchCustomerRewards';
import { logger } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';

export const claimReward = onRequest(async (request, response) => {
  cors()(request, response, () => {
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
            response.status(403).send({
              error: 'Loyalty card does not belong to this business.',
            });
            return;
          }

          const [business, customer, loyaltyProgramMilestone, customerRewards] =
            await Promise.all([
              fetchBusinessById(businessId),
              fetchCustomerById(loyaltyCard.customerId),
              fetchLoyaltyProgramMilestoneById(
                loyaltyProgramMilestoneId,
                loyaltyCard.loyaltyProgramId,
                businessId
              ),
              fetchCustomerRewards(businessId, loyaltyCard.id),
            ]);

          if (!loyaltyProgramMilestone) {
            response.status(404).send({ error: 'Milestone not found.' });
            return;
          }

          const { success, error, data } = await processClaimReward(
            {
              loyaltyCard,
              customer,
              business,
              loyaltyProgramMilestone,
              customerRewards,
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
            reward: await fetchCustomerRewardById(
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
});
