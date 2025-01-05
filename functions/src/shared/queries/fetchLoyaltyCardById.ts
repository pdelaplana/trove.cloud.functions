import { fetchDocumentById } from '../helpers/firebaseHelper';

export const fetchLoyaltyCardById = async (id: string) => {
  return fetchDocumentById('loyaltyCards', id);
};
