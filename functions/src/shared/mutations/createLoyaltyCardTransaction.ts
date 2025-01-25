import { LoyaltyCardTransaction } from '@src/domain';
import { db } from '../../firebase';

export const createLoyaltyCardTransaction = async (
  transaction: Omit<LoyaltyCardTransaction, 'id'>
): Promise<string> => {
  const businessRef = db.collection('businesses').doc(transaction.businessId);
  const transactionRef = await businessRef
    .collection('loyaltyCardTransactions')
    .add(transaction);

  return transactionRef.id;
};
