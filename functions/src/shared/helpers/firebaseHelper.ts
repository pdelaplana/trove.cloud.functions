import { db } from '@src/firebase';
import { logger } from 'firebase-functions/v2';

export const fetchDocumentById = async (collection: string, id: string) => {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) {
    logger.warn('Document not found', { id });
    return null;
  } else {
    return { ...doc.data(), id: doc.id };
  }
};
