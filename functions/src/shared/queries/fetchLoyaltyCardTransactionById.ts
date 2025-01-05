import { fetchDocumentById } from '../helpers/firebaseHelper';

export const fetchLoyaltyCardTransactionById = async (id: string) => {
  return fetchDocumentById('loyaltyCardTransactions', id);
};
