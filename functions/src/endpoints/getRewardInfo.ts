import { handleRequest } from '@src/shared/helpers/handleRequest';
import {
  fetchCustomerRewardById,
  fetchLoyaltyCardById,
} from '@src/shared/queries';
import { onRequest } from 'firebase-functions/v2/https';

export const getRewardInfo = onRequest(
  { memory: '256MiB', timeoutSeconds: 60 },
  async (request, response) => {
    handleRequest(
      'getRewardInfo',
      request,
      response,
      ['GET'],
      ['rewardcode'],
      {},
      async (context) => {
        const businessId = context.businessId;
        const rewardCode = context.params.rewardcode;

        const customerReward = await fetchCustomerRewardById(
          rewardCode,
          businessId
        );

        if (!customerReward) {
          response.status(404).send({ error: 'Reward not found.' });
          return;
        }

        // get loyalty card info
        const loyaltyCard = await fetchLoyaltyCardById(
          customerReward.loyaltyCardId,
          businessId
        );

        response
          .status(200)
          .send({ customerReward: customerReward, loyaltyCard: loyaltyCard });
      }
    );
  }
);
