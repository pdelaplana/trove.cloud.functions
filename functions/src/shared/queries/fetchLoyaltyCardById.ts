import { db } from '@src/firebase';
import { toLoyaltyCard } from '../mappers/toLoyaltyCard';

export const fetchLoyaltyCardById = async (id: string, businessId: string) => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }
  const loyaltyCardSnapshot = await businessRef
    .collection('loyaltyCards')
    .doc(id)
    .get();

  return toLoyaltyCard(loyaltyCardSnapshot);
};
