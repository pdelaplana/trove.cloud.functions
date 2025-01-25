import { generateKey } from '@src/shared/helpers/encryptionHelpers';
import { upsertApiKey } from '@src/shared/mutations/upsertApiKey';
import { onRequest } from 'firebase-functions/v2/https';

export const generateApiKey = onRequest(async (req, res) => {
  const { businessId } = req.body;
  if (!businessId) {
    res.status(400).send({ error: 'Business  ID is required' });
    return;
  }

  try {
    const apiKey = generateKey();
    await upsertApiKey(businessId, apiKey);
    res.status(200).send({
      message: 'API key generated and stored successfully',
      businessId,
      apiKey,
    });
  } catch (error) {
    res.status(500).send({ error: 'Failed to generate and store API key' });
  }
});
