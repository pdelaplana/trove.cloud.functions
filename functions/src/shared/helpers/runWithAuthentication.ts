import { logger } from 'firebase-functions/v2';
import { authenticateApiKey } from './authenticateApiKey';

export const runWithAuthentication = async <T>(
  request: any,
  response: any,
  fn: (context: Record<string, any>) => Promise<T>
) => {
  const businessId = await authenticateApiKey(request, response);

  try {
    const result = await fn({ businessId });
    return result;
  } catch (error) {
    logger.error('Internal server error', { error });
    response.status(500).send({ error: 'Internal server error' });
    return null;
  }
};
