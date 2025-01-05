import { db } from '@src/firebase';

export const deleteLoyaltyCardTransaction = async (transactionId: string) => {
  await db.collection('loyaltyCardTransactions').doc(transactionId).delete();
};
