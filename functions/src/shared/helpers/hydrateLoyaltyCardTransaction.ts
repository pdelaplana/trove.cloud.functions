import {
  Business,
  Customer,
  LoyaltyCard,
  LoyaltyCardTransaction,
} from '@src/domain';

export const hydrateLoyaltyCardTransaction = (
  loyaltyCard: LoyaltyCard,
  customer: Customer,
  business: Business
): Omit<LoyaltyCardTransaction, 'id'> => {
  return {
    businessId: business.id,
    businessName: business.name,
    businessEmail: business.email,
    loyaltyCardId: loyaltyCard.id,
    loyaltyProgramId: loyaltyCard.loyaltyProgramId,
    loyaltyProgramName: loyaltyCard.loyaltyProgramName,
    loyaltyProgramTierId: loyaltyCard.tierId,
    loyaltyProgramTierName: loyaltyCard.tierName,
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email,
    membershipNumber: loyaltyCard.membershipNumber,
    transactionDate: new Date(),
    transactionType: 'purchase',
    purchaseAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    earnedPoints: 0,
    bonusPoints: 0,
    redeemedPoints: 0,
    totalPoints: 0,
    rewardsEarned: [],
  } as Omit<LoyaltyCardTransaction, 'id'>;
};
