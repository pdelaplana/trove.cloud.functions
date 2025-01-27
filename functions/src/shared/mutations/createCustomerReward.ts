import {
  CustomerReward,
  CustomerRewardDiscountFixedAmount,
  CustomerRewardDiscountPercentage,
  CustomerRewardFreeProduct,
  CustomerRewardPointsBonus,
  CustomerRewardPromoCode,
} from '@src/domain/entities/customerReward';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { db } from '@src/firebase';
import { LoyaltyProgramReward } from '@src/domain';
import {
  LoyaltyProgramRewardDiscountFixedAmount,
  LoyaltyProgramRewardDiscountPercentage,
  LoyaltyProgramRewardFreeProduct,
  LoyaltyProgramRewardPointsBonus,
  LoyaltyProgramRewardPromoCode,
} from '@src/domain/entities/loyaltyProgramReward';

export const createCustomerReward = async (
  businessId: string,
  loyaltyCardId: string,
  reward: LoyaltyProgramReward
): Promise<string> => {
  return beginTimedOperation(
    'createCustomerReward',
    { businessId, loyaltyCardId, reward },
    async () => {
      // Implement the logic to create a customer reward
      const businessRef = db.collection('businesses').doc(businessId);
      if (!businessRef) {
        throw new Error(`Business with id ${businessId} not found`);
      }
      const loyaltyCardRef = businessRef
        .collection('loyaltyCards')
        .doc(loyaltyCardId);

      const loyaltyCard = (await loyaltyCardRef.get()).data();

      let customerReward: Omit<CustomerReward, 'id'> = {
        customerId: loyaltyCard?.customerId,
        businessId: loyaltyCard?.businessId,
        loyaltyCardId: loyaltyCardId,
        loyaltyProgramId: loyaltyCard?.loyaltyProgramId,
        rewardType: reward.rewardType,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        termsAndConditions: reward.termsAndConditions,
        validUntilDate: reward.validUntilDate ?? undefined,
        expiryDate: new Date(
          Date.now() + (reward.expiryInDays ?? 0 * 24 * 60 * 60 * 1000)
        ),
        claimedDate: new Date(),
      };

      switch (reward.rewardType) {
        case 'discountFixedAmount':
          customerReward = {
            ...customerReward,
            discountFixedAmount:
              (reward as LoyaltyProgramRewardDiscountFixedAmount)
                .discountFixedAmount ?? 0,
          } as CustomerRewardDiscountFixedAmount;
          break;
        case 'discountPercentage':
          customerReward = {
            ...customerReward,
            discountPercentage:
              (reward as LoyaltyProgramRewardDiscountPercentage)
                .discountPercentage ?? 0,
          } as CustomerRewardDiscountPercentage;
          break;
        case 'freeProduct':
          customerReward = {
            ...customerReward,
            freeProduct: (reward as LoyaltyProgramRewardFreeProduct)
              .freeProduct,
            freeProductQuantity: (reward as LoyaltyProgramRewardFreeProduct)
              .freeProductQuantity,
          } as CustomerRewardFreeProduct;
          break;
        case 'pointsBonus':
          customerReward = {
            ...customerReward,
            pointsBonus: (reward as LoyaltyProgramRewardPointsBonus)
              .pointsBonus,
          } as CustomerRewardPointsBonus;
          break;
        case 'promoCode':
          customerReward = {
            ...customerReward,
            promoCode: (reward as LoyaltyProgramRewardPromoCode).promoCode,
          } as CustomerRewardPromoCode;
          break;
      }

      const customerRewardRef = await loyaltyCardRef
        .collection('customerRewards')
        .add({ ...customerReward } as Omit<CustomerReward, 'id'>);

      return customerRewardRef.id;
    }
  );
};
