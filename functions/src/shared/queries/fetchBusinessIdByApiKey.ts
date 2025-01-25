import { db } from '@src/firebase';
import { bcryptCompare } from '../helpers/encryptionHelpers';

export const fetchBusinessIdByApiKey = async (
  providedApiKey: string
): Promise<string | null> => {
  const apiKeysRef = db.collection('apiKeys');
  const apiKeysSnapshot = await apiKeysRef.get();

  for (const doc of apiKeysSnapshot.docs) {
    const storedHashedKey = doc.data().hashedApiKey;
    if (await bcryptCompare(providedApiKey, storedHashedKey)) {
      return doc.data().businessId; // Return bsuiness ID if key matches
    }
  }

  throw new Error('Invalid API key');
};
