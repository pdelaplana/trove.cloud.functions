import { LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { logger } from 'firebase-functions/v2';
import { toLoyaltyCard } from '../mappers/toLoyaltyCard';
import { beginTimedOperation } from '../helpers/beginTimedOperation';

export const fetchLoyaltyCardByMembershipNumber = async (
  membershipNumber: string
): Promise<LoyaltyCard | null> => {
  return beginTimedOperation(
    'fetchLoyaltyCardByMembershipNumber',
    { membershipNumber },
    async () => {
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
    }
  );
};
