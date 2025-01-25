import { db } from '@src/firebase';

export const fetchLoyaltyCardTransactionById = async (
  id: string,
  businessId: string
) => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }
  const loyaltyCardTransaction = await businessRef
    .collection('loyaltyCardTransactions')
    .doc(id)
    .get();

  return {
    ...loyaltyCardTransaction.data(),
    id: loyaltyCardTransaction.id,
    businessId: loyaltyCardTransaction.ref.parent.parent?.id,
  };
};
