import { LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { logger } from 'firebase-functions/v2';
import { toLoyaltyCard } from '../mappers/toLoyaltyCard';

export const fetchLoyaltyCardByMembershipNumber = async (
  membershipNumber: string
): Promise<LoyaltyCard | null> => {
  logger.log('fetchLoyaltyCardByMembershipNumber - start', {
    membershipNumber,
  });

  const query = await db
    .collectionGroup('loyaltyCards')
    .where('membershipNumber', '==', membershipNumber)
    .limit(1)
    .get();

  if (query.empty) {
    logger.warn('Loyalty Card not found', { membershipNumber });
    return null;
  }

  return toLoyaltyCard(query.docs[0]);
};
