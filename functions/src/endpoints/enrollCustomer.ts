import { onRequest } from 'firebase-functions/v2/https';
import { upsertCustomer, createLoyaltyCard } from '../shared/mutations';
import { logger } from 'firebase-functions/v2';
import {
  fetchLoyaltyCardById,
  fetchLoyaltyProgramByUniqueCode,
} from '../shared/queries';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';

export const enrollCustomer = onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, phone, loyaltyProgramNumber } = request.body;
  if (!name || !email || !phone || !loyaltyProgramNumber) {
    response.status(400).send({ error: 'Missing required fields.' });
  }

  beginTimedOperation(
    'enrollCustomer',
    { name, email, phone, loyaltyProgramNumber },
    async () => {
      runWithAuthentication(request, response, async (context) => {
        const { businessId } = context;
        const customer = await upsertCustomer(name, email, phone);
        if (!customer) {
          response.status(500).send({ error: 'Error creating customer.' });
          return;
        }

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

        const loyaltyCardId = await createLoyaltyCard(
          customer!.id,
          loyaltyProgram!.businessId,
          loyaltyProgram!.id
        );

        response.status(200).send({
          message: 'Customer enrolled successfully.',
          loyaltyCard: await fetchLoyaltyCardById(
            loyaltyCardId,
            loyaltyProgram!.businessId
          ),
        });
      });
    }
  );
});
