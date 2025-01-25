import { LoyaltyCard } from '@src/domain';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export const toLoyaltyCard = (doc: DocumentSnapshot): LoyaltyCard => {
  const data = doc.data();
  if (!data?.membershipDate || !doc.ref.parent.parent?.id) {
    throw new Error('Invalid loyalty card data');
  }
  return {
    ...data,
    membershipDate: data.membershipDate.toDate(),
    id: doc.id,
    businessId: doc.ref.parent.parent.id,
  } as LoyaltyCard;
};
