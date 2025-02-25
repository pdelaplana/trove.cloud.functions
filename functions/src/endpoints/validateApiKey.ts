import { useConfig } from '@src/config';
import { decryptKey } from '@src/shared/helpers/encryptionHelpers';
import { fetchBusinessIdByApiKey } from '@src/shared/queries/fetchBusinessIdByApiKey';
import { fetchEncryptedApiKeyByBusinessId } from '@src/shared/queries/fetchEncryptedApiKeyByBusinessId';
import { onRequest } from 'firebase-functions/v2/https';

export const validateApiKey = onRequest(async (req, res) => {
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
      const encryptedKey = await fetchEncryptedApiKeyByBusinessId(businessId);
      if (!encryptedKey) throw new Error('Invalid API key');
      const decryptedKey = decryptKey(encryptedKey!);
      res
        .status(200)
        .send({ message: 'Valid API key', businessId, decryptedKey });
    } else {
      res.status(200).send({ message: 'Valid API key', businessId });
    }
  } catch (error) {
    res.status(401).send({ error: 'Invalid API key' });
  }
});
