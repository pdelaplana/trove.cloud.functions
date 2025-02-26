import { Customer } from '@src/domain';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { db } from '@src/firebase';
import { logger } from 'firebase-functions/v2';

export const fetchCustomerByEmailOrPhone = async (
  emailOrPhone: string
): Promise<Customer | null> => {
  return beginTimedOperation(
    'fetchCustomerByEmailOrPhone',
    { emailOrPhone },
    async () => {
      try {
        const customersRef = db.collection('customers');
        const [emailSnapshot, phoneSnapshot] = await Promise.all([
          customersRef.where('email', '==', emailOrPhone).limit(1).get(),
          customersRef.where('phone', '==', emailOrPhone).limit(1).get(),
        ]);

        if (emailSnapshot.empty && phoneSnapshot.empty) {
          logger.warn('Customer not found', { emailOrPhone });
          return null;
        }

        const snapshot = emailSnapshot.empty ? phoneSnapshot : emailSnapshot;

        const customer = {
          ...snapshot.docs[0].data(),
          id: snapshot.docs[0].id,
        } as Customer;
        return customer;
      } catch (error) {
        logger.error('Error fetching customer');
        throw error;
      }
    }
  );
};
