import { CustomerReward } from '@src/domain';
import { db } from '@src/firebase';
import { toCustomerReward } from '../mappers/toCustomerReward';

export const fetchCustomerRewardById = async (
  id: string,
  businessId: string
): Promise<CustomerReward> => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }

  const customerRewardSnapshot = await businessRef
    .collection('customerRewards')
    .doc(id)
    .get();

  return toCustomerReward(customerRewardSnapshot);
};
