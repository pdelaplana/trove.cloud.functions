import { LoyaltyCard } from '@src/domain';
import { db } from '@src/firebase';

export const fetchUsedMembershipNumbers = async (businessId: string) => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }
  const usedMembershipNumbersSnapshot = await businessRef
    .collection('usedMembershipNumbers')
    .get();

  return usedMembershipNumbersSnapshot.docs.map(
    (doc) => (doc.data() as LoyaltyCard).membershipNumber
  );
};
