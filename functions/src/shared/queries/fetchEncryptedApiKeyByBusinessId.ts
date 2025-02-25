import { db } from '../../firebase';
import { logger } from 'firebase-functions/v2';
import { beginTimedOperation } from '../helpers/beginTimedOperation';

export const fetchEncryptedApiKeyByBusinessId = async (
  businessId: string
): Promise<string | null> => {
  return beginTimedOperation(
    'fetchEncryptedApiKeyByBusinessId',
    { businessId },
    async () => {
      const query = await db
        .collection('apiKeys')
        .where('businessId', '==', businessId)
        .limit(1)
        .get();

      if (query.empty) {
        logger.warn('ApiKeys Not Found for {businessId}', { businessId });
        return null;
      }

      return query.docs[0].data().encryptedApiKey;
    }
  );
};
