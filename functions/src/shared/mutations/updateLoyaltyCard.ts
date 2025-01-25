import { LoyaltyCard } from '@src/domain';
import { db } from '@src/firebase';

export const updateLoyaltyCard = async (loyaltyCard: LoyaltyCard) => {
  const { id, businessId, ...loyaltyCardWithoutId } = loyaltyCard;

  const businessRef = db.collection('businesses').doc(businessId);
  const loyaltyCardsRef = businessRef.collection('loyaltyCards').doc(id);

  if (!loyaltyCardsRef) {
    throw new Error(`Loyalty card with id ${loyaltyCard.id} not found`);
  }

  await loyaltyCardsRef.set(loyaltyCardWithoutId, { merge: true });
};
