import { CustomerReward } from '@src/domain/entities/customerReward';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { db } from '@src/firebase';

export const addCustomerReward = async (
  customerReward: Omit<CustomerReward, 'id'>
): Promise<string> => {
  return beginTimedOperation(
    'addCustomerReward',
    { customerReward },
    async () => {
      // Implement the logic to create a customer reward
      const businessRef = db
        .collection('businesses')
        .doc(customerReward.businessId);
      if (!businessRef) {
        throw new Error(
          `Business with id ${customerReward.businessId} not found`
        );
      }

      const customerRewardRef = await businessRef
        .collection('customerRewards')
        .add({ ...customerReward } as Omit<CustomerReward, 'id'>);

      return customerRewardRef.id;
    }
  );
};
