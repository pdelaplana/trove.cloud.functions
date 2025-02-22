import { onRequest } from 'firebase-functions/v2/https';
import { upsertCustomer } from '../shared/mutations';
import { logger } from 'firebase-functions/v2';
import {
  fetchBusinessById,
  fetchLoyaltyCardById,
  fetchLoyaltyProgramByUniqueCode,
} from '../shared/queries';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';
import {
  createFirebaseEventBus,
  setupCustomerEnrolledHandlers,
} from '@src/eventBus';
import { enrollCustomerToLoyaltyProgram } from '@src/domain/operations/enrollCustomerToLoyaltyProgram';
import { fetchUsedMembershipNumbers } from '@src/shared/queries/fetchUsedmembershipNumbers';
import cors from 'cors';

export const enrollCustomer = onRequest(
  { memory: '256MiB', timeoutSeconds: 60 },
  async (request, response) => {
    cors({ origin: true })(request, response, () => {
      if (request.method !== 'POST') {
        response.status(405).send({ error: 'Method not allowed. Use POST.' });
      }

      const { name, email, phone, loyaltyProgramNumber } = request.body;
      if (!name || !email || !phone || !loyaltyProgramNumber) {
        response.status(400).send({ error: 'Missing required fields.' });
      }

      const eventBus = createFirebaseEventBus();
      setupCustomerEnrolledHandlers(eventBus);

      beginTimedOperation(
        'enrollCustomer',
        { name, email, phone, loyaltyProgramNumber },
        async () => {
          runWithAuthentication(request, response, async (context) => {
            const { businessId } = context;

            const loyaltyProgram =
              await fetchLoyaltyProgramByUniqueCode(loyaltyProgramNumber);

            if (!loyaltyProgram) {
              logger.warn('Business or loyalty program not found.', {
                loyaltyProgramNumber,
              });
              response
                .status(404)
                .send({ error: 'Business or loyalty program not found.' });
              return;
            }
            if (loyaltyProgram.businessId !== businessId) {
              response.status(403).send({
                error: 'Loyalty program does not belong to this business.',
              });
              return;
            }

            try {
              const [customer, business, usedMembershipNumbers] =
                await Promise.all([
                  upsertCustomer(name, email, phone),
                  fetchBusinessById(businessId),
                  fetchUsedMembershipNumbers(businessId),
                ]);
              if (!customer) {
                response
                  .status(500)
                  .send({ error: 'Error creating customer.' });
                return;
              }

              const result = await enrollCustomerToLoyaltyProgram(
                {
                  business,
                  customer,
                  loyaltyProgram,
                  usedMembershipNumbers,
                },
                eventBus
              );

              response.status(200).send({
                message: 'Customer enrolled successfully.',
                loyaltyCard: await fetchLoyaltyCardById(
                  result.data!.loyaltyCardId,
                  loyaltyProgram!.businessId
                ),
              });
            } catch (error) {
              response.status(500).send({ error: 'Error creating customer.' });
              return;
            }
          });
        }
      );
    });
  }
);
