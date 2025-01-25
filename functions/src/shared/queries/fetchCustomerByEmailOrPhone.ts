import { Customer } from '@src/domain';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { db } from '@src/firebase';
import { logger } from 'firebase-functions/v2';

export const fetchCustomerByEmailOrPhone = async (
  emailOrPhone: string
): Promise<Customer> => {
  return beginTimedOperation(
    'fetchCustomerByEmailOrPhone',
    { emailOrPhone },
    async () => {
      const customersRef = db.collection('customers');
      const query = customersRef.where('email', '==', emailOrPhone).limit(1);
      const snapshot = await query.get();
      if (snapshot.empty) {
        const query = customersRef.where('phone', '==', emailOrPhone).limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) {
          logger.warn('Customer not found', { emailOrPhone });
        }
      }

      const customer = {
        ...snapshot.docs[0].data(),
        id: snapshot.docs[0].id,
      } as Customer;
      return customer;
    }
  );
};
