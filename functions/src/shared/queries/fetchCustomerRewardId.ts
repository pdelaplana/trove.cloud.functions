import { CustomerReward } from '@src/domain';
import { db } from '@src/firebase';
import { toCustomerReward } from '../mappers/toCustomerReward';

export const fetchCustomerRewardId = async (
  id: string,
  businessId: string,
  loyaltyCardId: string
): Promise<CustomerReward> => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }
  const loyaltyCardRef = businessRef
    .collection('loyaltyCards')
    .doc(loyaltyCardId);

  const customerRewardSnapshot = await loyaltyCardRef
    .collection('customerRewards')
    .doc(id)
    .get();

  return toCustomerReward(customerRewardSnapshot);
};
