import { decryptKey } from '@src/shared/helpers/encryptionHelpers';
import { handleUnauthenticatedRequest } from '@src/shared/helpers/handleRequest';
import { onRequest } from 'firebase-functions/v2/https';

export const decryptApiKey = onRequest(async (req, res) => {
  handleUnauthenticatedRequest(
    'decryptApiKey',
    req,
    res,
    ['POST'],
    ['encryptedKey'],
    {},
    async (context) => {
      const { encryptedKey } = context.params;
      if (!encryptedKey) {
        res.status(400).send({ error: 'encryptedKey  is required' });
        return;
      }

      try {
        const decryptedKey = decryptKey(encryptedKey!);
        res.status(200).send({ decryptedKey });
      } catch (error) {
        res.status(500).send({ error: 'Unable to decrypt encryptedKey' });
      }
    }
  );
});
