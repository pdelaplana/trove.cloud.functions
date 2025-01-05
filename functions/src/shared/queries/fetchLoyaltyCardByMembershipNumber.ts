import { LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { logger } from 'firebase-functions/v2';

export const fetchLoyaltyCardByMembershipNumber = async (
  membershipNumber: string
): Promise<LoyaltyCard | null> => {
  const query = await db
    .collection('loyaltyCards')
    .where('membershipNumber', '==', membershipNumber)
    .get();

  if (query.empty) {
    logger.warn('Loyaltty Card not found', { membershipNumber });
    return null;
  } else {
    const doc = query.docs[0];
    return { ...doc.data(), id: doc.id } as LoyaltyCard;
  }
};
