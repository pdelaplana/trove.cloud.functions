import { useConfig } from '@src/config';
import { upsertApiKey } from '@src/shared/mutations';
import { fetchBusinessIdByApiKey } from '@src/shared/queries/fetchBusinessIdByApiKey';
import { onRequest } from 'firebase-functions/v2/https';

export const regenerateApiKey = onRequest(async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    res.status(400).send({ error: 'API key is required' });
    return;
  }

  try {
    const businessId = await fetchBusinessIdByApiKey(apiKey);
    if (!businessId) throw new Error('Invalid API key');

    const { ENVIRONMENT } = useConfig();
    if (ENVIRONMENT === 'development') {
      await upsertApiKey(businessId, apiKey);
      res.status(200).send({
        message: 'API key regenerated and stored successfully',
        businessId,
        apiKey,
      });
    } else {
      res.status(403).send({ message: 'Function is only available in dev' });
    }
  } catch (error) {
    res.status(401).send({ error: 'Invalid API key' });
  }
});
