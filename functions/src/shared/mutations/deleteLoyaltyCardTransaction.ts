import { db } from '@src/firebase';

export const deleteLoyaltyCardTransaction = async (
  businessId: string,
  transactionId: string
) => {
  await db
    .collection('business')
    .doc(businessId)
    .collection('loyaltyCardTransactions')
    .doc(transactionId)
    .delete();
};
