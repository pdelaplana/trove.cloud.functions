import { LoyaltyProgram } from '@src/domain';
import { db } from '@src/firebase';
import { logger } from 'firebase-functions/v2';

export const fetchLoyaltyProgramByUniqueCode = async (uniqueCode: string) => {
  const query = await db
    .collectionGroup('loyaltyPrograms')
    .where('uniqueCode', '==', uniqueCode)
    .get();

  if (query.empty) {
    logger.warn('Program not found', { uniqueCode });
    return null;
  } else {
    const doc = query.docs[0];
    return { ...doc.data(), id: doc.id } as {
      businessId: string;
      businessName: string;
    } & LoyaltyProgram;
  }
};
