import {
  LoyaltyCard,
  Business,
  Customer,
  LoyaltyProgramMilestone,
  CustomerReward,
} from '@src/domain';
import { LoyaltyCardTransactionType } from '@src/domain/entities/loyaltyCardTransaction';
import { EventBus } from '@src/domain/events/eventBus';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  LoyaltyProgramRewardDiscountFixedAmount,
  LoyaltyProgramRewardDiscountPercentage,
  LoyaltyProgramRewardFreeProduct,
} from '@src/domain/entities/loyaltyProgramReward';
import { processClaimReward } from '@src/domain/operations';

describe('Reward Claiming System', () => {
  let mockEventBus: EventBus;
  let mockContext: {
    loyaltyCard: LoyaltyCard;
    business: Business;
    customer: Customer;
    loyaltyProgramMilestone: LoyaltyProgramMilestone;
    customerRewards: CustomerReward[];
    transactionType: LoyaltyCardTransactionType;
  };

  beforeEach(() => {
    // Mock EventBus
    mockEventBus = {
      publish: jest.fn().mockImplementation(async (event: any) => {
        if (event.type === 'RewardClaimed') {
          return new Map([
            [
              'RewardClaimed',
              {
                success: true,
                data: {
                  rewardId: 'test-reward-123',
                  transactionId: 'test-transaction-123',
                },
              },
            ],
          ]);
        }
        return new Map();
      }),
      publishAll: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as EventBus;

    // Setup mock context
    mockContext = {
      loyaltyCard: {
        id: 'card-123',
        loyaltyProgramId: 'program-123',
        loyaltyProgramName: 'Test Program',
        tierId: 'tier-123',
        tierName: 'Gold',
        membershipNumber: 'MEM123',
        rewardPoints: 1000,
      } as LoyaltyCard,
      business: {
        id: 'business-123',
        name: 'Test Business',
        email: 'business@test.com',
      } as Business,
      customer: {
        id: 'customer-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      } as Customer,
      loyaltyProgramMilestone: {
        id: 'milestone-123',
        businessId: 'business-123',
        loyaltyProgramId: 'program-123',
        points: 500,
        reward: {
          rewardType: 'discountFixedAmount',
          name: 'Test Reward',
          description: 'Test Description',
          imageUrl: 'test.jpg',
          termsAndConditions: 'Terms',
          expiryInDays: 30,
          discountFixedAmount: 50,
        },
      } as LoyaltyProgramMilestone,
      customerRewards: [],
      transactionType: 'redeem' as LoyaltyCardTransactionType,
    };
  });

  describe('processClaimReward', () => {
    it('should successfully process a valid reward claim', async () => {
      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        rewardId: 'test-reward-123',
        transactionId: 'test-transaction-123',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RewardClaimed',
        })
      );
    });

    it('should fail when reward has expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockContext.loyaltyProgramMilestone.reward.validUntilDate = expiredDate;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(false);
      expect(result.error).toMatch('Reward has expired');
      expect(mockEventBus.publish).toHaveBeenCalledWith({
        type: 'RewardClaimFailed',
        payload: {
          error: 'Reward has expired.',
        },
      });
    });

    it('should fail when reward is already claimed', async () => {
      mockContext.customerRewards = [
        {
          loyaltyProgramMilestoneId: 'milestone-123',
        } as CustomerReward,
      ];

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(false);
      expect(result.error).toMatch('Reward already claimed');
    });

    it('should fail when points balance is insufficient', async () => {
      mockContext.loyaltyCard.rewardPoints = 100;
      mockContext.loyaltyProgramMilestone.points = 500;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(false);
      expect(result.error).toMatch('Insufficient points balance');
    });
  });

  describe('Reward Type Processing', () => {
    it('should process discount fixed amount reward correctly', async () => {
      mockContext.loyaltyProgramMilestone.reward = {
        rewardType: 'discountFixedAmount',
        name: 'Fixed Discount',
        discountFixedAmount: 50,
        expiryInDays: 30,
      } as LoyaltyProgramRewardDiscountFixedAmount;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            customerReward: expect.objectContaining({
              rewardType: 'discountFixedAmount',
              discountFixedAmount: 50,
            }),
          }),
        })
      );
    });

    it('should process discount percentage reward correctly', async () => {
      mockContext.loyaltyProgramMilestone.reward = {
        rewardType: 'discountPercentage',
        name: 'Percentage Discount',
        discountPercentage: 25,
        expiryInDays: 30,
      } as LoyaltyProgramRewardDiscountPercentage;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            customerReward: expect.objectContaining({
              rewardType: 'discountPercentage',
              discountPercentage: 25,
            }),
          }),
        })
      );
    });

    it('should process free product reward correctly', async () => {
      mockContext.loyaltyProgramMilestone.reward = {
        rewardType: 'freeProduct',
        name: 'Free Product',
        freeProduct: 'Test Product',
        freeProductQuantity: 1,
        expiryInDays: 30,
      } as LoyaltyProgramRewardFreeProduct;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            customerReward: expect.objectContaining({
              rewardType: 'freeProduct',
              freeProduct: 'Test Product',
              freeProductQuantity: 1,
            }),
          }),
        })
      );
    });
  });

  describe('Transaction Processing', () => {
    it('should correctly update points balance after redemption', async () => {
      const initialPoints = 1000;
      const pointsToRedeem = 500;

      mockContext.loyaltyCard.rewardPoints = initialPoints;
      mockContext.loyaltyProgramMilestone.points = pointsToRedeem;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            loyaltyCard: expect.objectContaining({
              rewardPoints: initialPoints - pointsToRedeem,
            }),
          }),
        })
      );
    });

    it('should set correct expiry date based on expiryInDays', async () => {
      const expiryInDays = 30;
      mockContext.loyaltyProgramMilestone.reward.expiryInDays = expiryInDays;

      const result = await processClaimReward(mockContext, mockEventBus);

      expect(result.success).toBe(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            customerReward: expect.objectContaining({
              expiryDate: expect.any(Date),
            }),
          }),
        })
      );
    });
  });
});
