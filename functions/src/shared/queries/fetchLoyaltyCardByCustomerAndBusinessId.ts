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
      const businessRef = db.collection('businesses').doc(businessId);
      if (!businessRef) {
        throw new Error(`Business with id ${businessId} not found`);
      }
      const query = await businessRef
        .collection('loyaltyCards')
        .where('customerId', '==', customerId)
        .limit(1)
        .get();

      if (query.empty) {
        logger.warn('Loyalty Card not found', { customerId });
        return null;
      }

      return toLoyaltyCard(query.docs[0]);
    }
  );
};
