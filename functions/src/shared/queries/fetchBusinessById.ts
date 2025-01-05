import { Business } from '@src/domain';
import { fetchDocumentById } from '@src/shared/helpers/firebaseHelper';

export const fetchBusinessById = async (id: string): Promise<Business> => {
  return (await fetchDocumentById('businesses', id)) as Business;
};
