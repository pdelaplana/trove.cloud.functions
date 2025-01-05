import { LoyaltyCardTransaction } from '@src/domain';
import { db } from '../../firebase';

export const createLoyaltyCardTransaction = async (
  transaction: Omit<LoyaltyCardTransaction, 'id'>
): Promise<string> => {
  const reference = await db
    .collection('loyaltyCardTransactions')
    .add(transaction);
  return reference.id;
};
