import { onRequest } from 'firebase-functions/v2/https';
import { upsertCustomer, createLoyaltyCard } from '../shared/mutations';
import { logger } from 'firebase-functions/v2';
import {
  fetchLoyaltyCardById,
  fetchLoyaltyProgramByUniqueCode,
} from '../shared/queries';

export const enrollCustomer = onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, phone, loyaltyProgramNumber } = request.body;
  if (!name || !email || !phone || !loyaltyProgramNumber) {
    response.status(400).send({ error: 'Missing required fields.' });
  }

  const customer = await upsertCustomer(name, email, phone);
  if (!customer) {
    response.status(500).send({ error: 'Error creating customer.' });
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
  }

  const loyaltyCardId = await createLoyaltyCard(
    customer!.id,
    loyaltyProgram!.businessId,
    loyaltyProgram!.id
  );

  response.status(200).send({
    message: 'Customer enrolled successfully.',
    loyaltyCard: await fetchLoyaltyCardById(loyaltyCardId),
  });
});
