import { LoyaltyCard } from '@src/domain';
import { fetchDocumentById } from '../helpers/firebaseHelper';
import { db } from '@src/firebase';

export const updateLoyaltyCard = async (loyaltyCard: LoyaltyCard) => {
  const existingCard = await fetchDocumentById('loyaltyCards', loyaltyCard.id);
  if (!existingCard) {
    throw new Error(`Loyalty card with id ${loyaltyCard.id} not found`);
  }

  await db
    .collection('loyaltyCards')
    .doc(loyaltyCard.id)
    .set(loyaltyCard, { merge: true });
};
