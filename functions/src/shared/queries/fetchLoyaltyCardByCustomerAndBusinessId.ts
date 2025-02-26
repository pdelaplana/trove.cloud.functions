import { db } from '@src/firebase';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { logger } from 'firebase-functions/v2';
import { toLoyaltyCard } from '../mappers/toLoyaltyCard';

export const fetchLoyaltyCardByCustomerAndBusinessId = async (
  customerId: string,
  businessId: string
) => {
  return beginTimedOperation(
    'fetchLoyaltyCardByCustomerAndBusinessId',
    { customerId, businessId },
    async () => {
      try {
        const query = await db
          .collection('businesses')
          .doc(businessId)
          .collection('loyaltyCards')
          .where('customerId', '==', customerId)
          .limit(1)
          .get();

        if (query.empty) {
          logger.warn('Loyalty Card not found', { customerId, businessId });
          return null;
        }

        return toLoyaltyCard(query.docs[0]);
      } catch (error) {
        logger.error('Error fetching loyalty card', { error });
        throw error;
      }
    }
  );
};
