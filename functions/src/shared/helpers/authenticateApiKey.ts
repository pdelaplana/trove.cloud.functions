import { fetchBusinessIdByApiKey } from '../queries';
import { logger } from 'firebase-functions/v2';

export const authenticateApiKey = async (request: any, response: any) => {
  const apiKey = request.headers['x-api-key'] as string;
  if (!apiKey) {
    logger.error('API key is required');
    response.status(400).send({ error: 'API key is required' });
    return null;
  }
  const businessId = await fetchBusinessIdByApiKey(apiKey);
  if (!businessId) {
    logger.error('Invalid API key');

    response.status(401).send({ error: 'Invalid API key' });
    return null;
  }
  return businessId;
};
