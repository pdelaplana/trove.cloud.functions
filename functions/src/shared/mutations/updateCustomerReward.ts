import { CustomerReward } from '@src/domain';
import { db } from '@src/firebase';
import { toCustomerReward } from '../mappers/toCustomerReward';
import { logger } from 'firebase-functions/v2';

export const updateCustomerReward = async (customerReward: CustomerReward) => {
  try {
    const { id, businessId, ...customerRewardWithoutId } = customerReward;

    // Implement the logic to update a customer reward
    const businessRef = db.collection('businesses').doc(businessId);
    if (!businessRef) {
      throw new Error(
        `Business with id ${customerReward.businessId} not found`
      );
    }

    await businessRef
      .collection('customerRewards')
      .doc(id)
      .set({ ...customerRewardWithoutId } as Omit<CustomerReward, 'id'>, {
        merge: true,
      });

    return toCustomerReward(
      await businessRef.collection('customerRewards').doc(id).get()
    );
  } catch (error) {
    logger.error('Error updating customer reward', error);
    return null;
  }
};
