import { onRequest } from 'firebase-functions/v2/https';
import {
  fetchBusinessById,
  fetchLoyaltyCardTransactionById,
  fetchLoyaltyCardByMembershipNumber,
} from '../shared/queries';
import { LoyaltyCardTransaction } from '@src/domain';
import {
  createLoyaltyCardTransaction,
  deleteLoyaltyCardTransaction,
  updateLoyaltyCard,
} from '../shared/mutations';

export const completePurchase = onRequest(async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send({ error: 'Method not allowed. Use POST.' });
  }

  // check for required fields
  const { customerEmail, customerPhone, membershipNumber, amount } =
    request.body;

  if (!customerEmail || !customerPhone || !membershipNumber || !amount) {
    response.status(400).send({ error: 'Missing required fields.' });
  }

  const transaction: LoyaltyCardTransaction = {
    id: '',
    businessId: '',
    businessName: '',
    businessEmail: '',
    loyaltyCardId: '',
    loyaltyProgramId: '',
    loyaltyProgramName: '',
    customerId: '',
    customerName: '',
    customerEmail: customerEmail,
    membershipNumber: membershipNumber,
    transactionDate: new Date(),
    purchaseAmount: amount,
    discountAmount: 0,
    finalAmount: 0,
    earnedPoints: 0,
    bonusPoints: 0,
    redeemedPoints: 0,
    totalPoints: 0,
    rewardsEarned: [],
  };

  // fetch using loyalty card using membershipNumber
  const loyaltyCard =
    await fetchLoyaltyCardByMembershipNumber(membershipNumber);

  if (!loyaltyCard) {
    response.status(404).send({ error: 'Loyalty card not found.' });
  }

  const business = await fetchBusinessById(loyaltyCard!.businessId);
  const loyaltyProgram = business.loyaltyPrograms?.find(
    (program) => program.id === loyaltyCard!.loyaltyProgramId
  );

  transaction.membershipNumber = loyaltyCard!.membershipNumber;
  transaction.customerId = loyaltyCard!.customerId;
  transaction.businessId = business.id;
  transaction.businessName = business.name;
  transaction.businessEmail = business.email;
  transaction.loyaltyProgramId = loyaltyProgram!.id;
  transaction.loyaltyProgramName = loyaltyProgram!.name;

  transaction.finalAmount = amount;

  // calculate points earned based loyalty program
  if (loyaltyProgram!.type === 'pointsPerSpend') {
    transaction.earnedPoints = amount * (loyaltyProgram!.pointsPerSpend ?? 1);
  } else if (loyaltyProgram!.type === 'stampsPerPurchase') {
    // todo: implement stampsPerPurchase
  }

  // check if customer is on a tier and apply any perks
  const tier = loyaltyProgram?.tiers.find(
    (tier) => tier.id === loyaltyCard!.tierId
  );
  if (tier) {
    tier.perks.forEach((perk) => {
      switch (perk.perkType) {
        case 'discount':
          transaction.discountAmount = amount * (perk.discountPercentage ?? 0);
          transaction.finalAmount = amount - transaction.discountAmount;
          break;
        case 'pointsBonus':
          transaction.bonusPoints = amount * (perk.pointsBonus ?? 0);
          transaction.earnedPoints += transaction.bonusPoints;

          break;
        case 'freeProduct':
          transaction.rewardsEarned.push(perk.freeProduct ?? '');
      }
    });
  }
  // finalize points calculation for this transaction
  transaction.totalPoints =
    transaction.earnedPoints +
    transaction.bonusPoints -
    transaction.redeemedPoints;

  let id;
  try {
    id = await createLoyaltyCardTransaction(transaction);

    if (id) {
      // update loyalty card with new transaction
      loyaltyCard!.points += transaction.totalPoints;

      // check if customer has enough points to go to next tier
      const nextTier = loyaltyProgram?.tiers
        .filter((tier) => tier.pointsThreshold <= loyaltyCard!.points)
        .sort((a, b) => a.pointsThreshold - b.pointsThreshold)[0];

      if (nextTier && loyaltyCard!.tierId !== nextTier.id) {
        loyaltyCard!.tierId = nextTier.id;
      }

      await updateLoyaltyCard(loyaltyCard!);
    }

    response.status(200).send({
      message: 'Transaction completed successfully.',
      transaction: await fetchLoyaltyCardTransactionById(id),
    });
  } catch (error) {
    // somethin went wrong with the transaction so we need to rollback
    if (id) {
      // delete transaction
      await deleteLoyaltyCardTransaction(id);
    }
    response.status(500).send({ error: 'Error completing transaction.' });
  }
});
