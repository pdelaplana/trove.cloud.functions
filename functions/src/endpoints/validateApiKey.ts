import { fetchBusinessIdByApiKey } from '@src/shared/queries/fetchBusinessIdByApiKey';
import { onRequest } from 'firebase-functions/v2/https';

export const validateApiKey = onRequest(async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    res.status(400).send({ error: 'API key is required' });
    return;
  }

  try {
    const businessId = await fetchBusinessIdByApiKey(apiKey);
    res.status(200).send({ message: 'Valid API key', businessId });
  } catch (error) {
    res.status(401).send({ error: 'Invalid API key' });
  }
});
