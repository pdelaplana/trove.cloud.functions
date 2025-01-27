import { allowedMethods } from '@src/shared/helpers/allowedMethods';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';
import { createCustomerReward } from '@src/shared/mutations';
import {
  fetchLoyaltyCardByMembershipNumber,
  fetchLoyaltyProgramById,
} from '@src/shared/queries';
import { onRequest } from 'firebase-functions/v2/https';

export const claimReward = onRequest(async (request, response) => {
  allowedMethods(request, response, ['POST']);

  const { membershipNumber, rewardMilestoneId } = request.body;

  beginTimedOperation(
    'claimReward',
    { membershipNumber, rewardMilestoneId },
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

        const loyaltyProgram = await fetchLoyaltyProgramById(
          loyaltyCard.loyaltyProgramId,
          businessId
        );
        const milestone = loyaltyProgram.milestones.find(
          (milestone) => milestone.id === rewardMilestoneId
        );

        if (!milestone) {
          response.status(404).send({ error: 'Milestone not found.' });
          return;
        }

        if (loyaltyCard.points < milestone.points) {
          response
            .status(403)
            .send({ error: 'Insufficient points to claim this reward' });
          return;
        }

        // add the reward to the loyalty card
        const rewardId = await createCustomerReward(
          loyaltyCard.businessId,
          loyaltyCard.id,
          milestone.reward
        );

        response.status(200).send({ message: 'Reward claimed', rewardId });
      });
    }
  );
});
