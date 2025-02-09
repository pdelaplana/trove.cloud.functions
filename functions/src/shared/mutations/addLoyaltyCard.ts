import { LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { beginTimedOperation } from '../helpers/beginTimedOperation';

export const addLoyaltyCard = async (loyaltyCard: Omit<LoyaltyCard, 'id'>) => {
  return beginTimedOperation('createLoyaltyCard', { loyaltyCard }, async () => {
    const businessRef = db.collection('businesses').doc(loyaltyCard.businessId);

    const loyaltyCardsRef = businessRef.collection('loyaltyCards');

    const result = await loyaltyCardsRef.add(loyaltyCard);

    return result.id;
  });
};
