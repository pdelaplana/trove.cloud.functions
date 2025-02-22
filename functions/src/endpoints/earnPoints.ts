import { onRequest } from 'firebase-functions/v2/https';
import {
  fetchBusinessById,
  fetchLoyaltyCardByMembershipNumber,
  fetchCustomerById,
  fetchLoyaltyCardTransactionById,
} from '../shared/queries';
import { fetchLoyaltyProgramById } from '@src/shared/queries/fetchLoyaltyProgramById';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';
import { processPurchase } from '@src/domain/operations/processPurchase';
import {
  createFirebaseEventBus,
  setupPointsEarnedEventHandlers,
} from '@src/eventBus';
import { logger } from 'firebase-functions/v2';
import cors from 'cors';

export const earnPoints = onRequest(
  { memory: '256MiB', timeoutSeconds: 60 },
  async (request, response) => {
    cors({ origin: true })(request, response, () => {
      const { customerEmail, customerPhone, membershipNumber, amount } =
        request.body;

      beginTimedOperation(
        'earnPoints',
        { customerEmail, customerPhone, membershipNumber, amount },
        async () => {
          if (request.method !== 'POST') {
            response
              .status(405)
              .send({ error: 'Method not allowed. Use POST.' });
            return;
          }

          // check for required fields
          if (
            (!customerEmail && !customerPhone && !membershipNumber) ||
            !amount
          ) {
            response.status(400).send({ error: 'Missing required fields.' });
            return;
          }

          runWithAuthentication(request, response, async (context) => {
            const { businessId } = context;

            // fetch using loyalty card using membershipNumber
            const loyaltyCard =
              await fetchLoyaltyCardByMembershipNumber(membershipNumber);

            if (!loyaltyCard) {
              response.status(404).send({ error: 'Loyalty card not found.' });
              return;
            }

            if (loyaltyCard.businessId !== businessId) {
              response.status(403).send({
                error: 'Loyalty card does not belong to this business.',
              });
              return;
            }

            const eventBus = createFirebaseEventBus();
            setupPointsEarnedEventHandlers(eventBus);

            try {
              const [business, customer, loyaltyProgram] = await Promise.all([
                fetchBusinessById(loyaltyCard!.businessId),
                fetchCustomerById(loyaltyCard!.customerId),
                fetchLoyaltyProgramById(
                  loyaltyCard.loyaltyProgramId,
                  loyaltyCard.businessId
                ),
              ]);
              const result = await processPurchase(
                {
                  business,
                  customer,
                  loyaltyCard,
                  loyaltyProgram,
                  amount,
                  transactionType: 'purchase',
                },
                eventBus
              );

              response.status(200).send({
                message: 'Transaction completed successfully.',
                transaction: await fetchLoyaltyCardTransactionById(
                  result.data!.transactionId,
                  loyaltyCard!.businessId
                ),
              });
            } catch (error) {
              logger.error('Error processing purchase transaction', error);
              response
                .status(500)
                .send({ error: 'Error completing transaction.' });
            }
          });
        }
      );
    });
  }
);
