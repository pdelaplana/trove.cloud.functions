import { Customer } from '@src/domain';
import { db } from '../../firebase';
import { Filter } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

export const upsertCustomer = async (
  name: string,
  email: string,
  phone: string
) => {
  try {
    const customersRef = db.collection('customers');
    const query = customersRef.where(
      Filter.or(
        Filter.where('email', '==', email),
        Filter.where('phone', '==', phone)
      )
    );
    const [existingCustomer] = (await query.get()).docs;

    if (!existingCustomer) {
      const customerRef = (
        await db.collection('customers').add({
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1],
          email,
          phone,
          gender: 'preferNotToSay',
          created: new Date(),
        } as Omit<Customer, 'id'>)
      ).get();

      return {
        ...(await customerRef).data(),
        id: (await customerRef).id,
      } as Customer;
    } else {
      logger.info('Customer already exists', existingCustomer.id);

      return {
        ...existingCustomer.data(),
        id: existingCustomer.id,
      } as Customer;
    }
  } catch (error) {
    logger.error('Error creating customer', error);
    return;
  }
};
