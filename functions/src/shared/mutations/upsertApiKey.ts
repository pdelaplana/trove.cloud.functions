import { db } from '../../firebase';
import { encryptKey, hashKey } from '../helpers/encryptionHelpers';
import { logger } from 'firebase-functions/v2';

export const upsertApiKey = async (businessId: string, apiKey: string) => {
  try {
    const hashedKey = await hashKey(apiKey);
    const encryptedKey = encryptKey(apiKey);

    const apiKeysRef = db.collection('apiKeys');
    const query = apiKeysRef.where('businessId', '==', businessId);

    const [existingKey] = (await query.get()).docs;

    if (existingKey) {
      await existingKey.ref.set(
        {
          businessId: businessId,
          hashedApiKey: hashedKey,
          encryptedApiKey: encryptedKey,
        },
        { merge: true }
      );
      return (await existingKey.ref.get()).data();
    } else {
      const docRef = await apiKeysRef.add({
        businessId: businessId,
        hashedApiKey: hashedKey,
        encryptedApiKey: encryptedKey,
      });
      return (await docRef.get()).data();
    }
  } catch (error) {
    logger.error('Error upserting API key', error);
    throw error;
  }
};
