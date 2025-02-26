import { decryptKey } from '@src/shared/helpers/encryptionHelpers';
import { onRequest } from 'firebase-functions/v2/https';

export const decryptApiKey = onRequest(async (req, res) => {
  const { encryptedKey } = req.body;
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
});
