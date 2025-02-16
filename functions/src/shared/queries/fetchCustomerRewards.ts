import { db } from '@src/firebase';
import { toCustomerReward } from '../mappers/toCustomerReward';
import { logger } from 'firebase-functions/v2';

export const fetchCustomerRewards = async (
  businessId: string,
  loyaltyCardId: string
) => {
  try {
    const businessRef = db.collection('businesses').doc(businessId);
    if (!businessRef) {
      throw new Error(`Business with id ${businessId} not found`);
    }
    const loyaltyCardRef = businessRef
      .collection('loyaltyCards')
      .doc(loyaltyCardId);

    const customerRewardsSnapshot = await loyaltyCardRef
      .collection('customerRewards')
      .get();

    return customerRewardsSnapshot.docs.map((doc) => toCustomerReward(doc));
  } catch (error) {
    logger.error(error);
    return [];
  }
};
