import { Customer } from '@src/domain';
import { fetchDocumentById } from '../helpers/firebaseHelper';

export const fetchCustomerById = async (id: string): Promise<Customer> => {
  return (await fetchDocumentById('customers', id)) as Customer;
};
