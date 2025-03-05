import { processRedeemReward } from '@src/domain/operations/processRedeemReward';
import {
  createFirebaseEventBus,
  setupRewardEventHandlers,
} from '@src/eventBus';
import { handleRequest } from '@src/shared/helpers/handleRequest';
import {
  fetchBusinessById,
  fetchCustomerById,
  fetchCustomerRewardById,
  fetchLoyaltyCardById,
  fetchLoyaltyCardTransactionById,
} from '@src/shared/queries';
import { logger } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

export const redeemReward = onRequest(
  { memory: '256MiB', timeoutSeconds: 60 },
  async (request, response) => {
    handleRequest(
      'redeemReward',
      request,
      response,
      ['POST'],
      ['rewardCode', 'amount'],
      {},
      async (context) => {
        const { businessId } = context;
        const { rewardCode, amount } = context.params;

        const customerReward = await fetchCustomerRewardById(
          rewardCode,
          businessId
        );

        if (!customerReward) {
          response.status(404).send({ error: 'Reward not found.' });
          return;
        }

        const [business, customer, loyaltyCard] = await Promise.all([
          fetchBusinessById(businessId),
          fetchCustomerById(customerReward.customerId),
          fetchLoyaltyCardById(customerReward.loyaltyCardId, businessId),
        ]);

        if (!business || !customer || !loyaltyCard) {
          logger.error('Business, customer or loyalty card not found', {
            business,
            customer,
            loyaltyCard,
          });
          response.status(404).send({ error: 'Missing prereqs' });
          return;
        }

        const eventBus = createFirebaseEventBus();
        setupRewardEventHandlers(eventBus);

        const { success, error, data } = await processRedeemReward(
          {
            purchaseAmount: amount,
            business,
            loyaltyCard,
            customer,
            customerReward,
            transactionType: 'redeem',
          },
          eventBus
        );

        if (!success || !data) {
          logger.error('Error redeeming reward', { error });
          response.status(500).send({ error: error });
          return;
        }

        response.status(200).send({
          message: 'Reward redeemed successfully',
          transaction: await fetchLoyaltyCardTransactionById(
            data.transactionId,
            businessId
          ),
        });
      }
    );
  }
);
