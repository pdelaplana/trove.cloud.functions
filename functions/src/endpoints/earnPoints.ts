import { onRequest } from 'firebase-functions/v2/https';
import {
  fetchBusinessById,
  fetchLoyaltyCardTransactionById,
  fetchLoyaltyCardByMembershipNumber,
  fetchCustomerById,
} from '../shared/queries';
import { LoyaltyCardTransaction } from '@src/domain';
import {
  createLoyaltyCardTransaction,
  deleteLoyaltyCardTransaction,
  updateLoyaltyCard,
} from '../shared/mutations';
import { fetchLoyaltyProgramById } from '@src/shared/queries/fetchLoyaltyProgramById';
import { beginTimedOperation } from '@src/shared/helpers/beginTimedOperation';
import { runWithAuthentication } from '@src/shared/helpers/runWithAuthentication';

export const earnPoints = onRequest(async (request, response) => {
  // check for required fields
  const { customerEmail, customerPhone, membershipNumber, amount } =
    request.body;

  beginTimedOperation(
    'earnPoints',
    { customerEmail, customerPhone, membershipNumber, amount },
    async () => {
      if (request.method !== 'POST') {
        response.status(405).send({ error: 'Method not allowed. Use POST.' });
        return;
      }

      if ((!customerEmail && !customerPhone && !membershipNumber) || !amount) {
        response.status(400).send({ error: 'Missing required fields.' });
        return;
      }

      runWithAuthentication(request, response, async (context) => {
        const { businessId } = context;
        // fetch using loyalty card using membershipNumber
        const loyaltyCard =
          await fetchLoyaltyCardByMembershipNumber(membershipNumber);

        if (!loyaltyCard) {
          response.status(404).send({ error: 'Loyalty card not found.' });
          return;
        }

        if (loyaltyCard.businessId !== businessId) {
          response.status(403).send({
            error: 'Loyalty card does not belong to this business.',
          });
          return;
        }

        const transaction: Omit<LoyaltyCardTransaction, 'id'> = {
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

        const business = await fetchBusinessById(loyaltyCard!.businessId);
        const loyaltyProgram = await fetchLoyaltyProgramById(
          loyaltyCard.loyaltyProgramId,
          business.id
        );

        const customer = await fetchCustomerById(loyaltyCard!.customerId);

        transaction.loyaltyCardId = loyaltyCard!.id;
        transaction.membershipNumber = loyaltyCard!.membershipNumber;
        transaction.customerId = loyaltyCard!.customerId;
        transaction.customerName = `${customer.firstName} ${customer.lastName}`;
        transaction.customerEmail = customer.email;
        transaction.businessId = business.id;
        transaction.businessName = business.name;
        transaction.businessEmail = business.email;
        transaction.loyaltyProgramId = loyaltyProgram!.id;
        transaction.loyaltyProgramName = loyaltyProgram!.name;

        transaction.finalAmount = amount;

        // calculate points earned based loyalty program
        if (loyaltyProgram!.type === 'pointsPerSpend') {
          transaction.earnedPoints =
            amount * (loyaltyProgram!.pointsPerSpend ?? 1);
        } else if (loyaltyProgram!.type === 'stampsPerPurchase') {
          // todo: implement stampsPerPurchase
        }

        // check if customer is on a tier and apply any perks
        const tier = loyaltyProgram?.tiers.find(
          (tier: any) => tier.id === loyaltyCard!.tierId
        );
        if (tier) {
          tier.perks.forEach((perk: any) => {
            switch (perk.perkType) {
              case 'discount':
                transaction.discountAmount =
                  amount * (perk.discountPercentage ?? 0);
                transaction.finalAmount = amount - transaction.discountAmount;
                break;
              case 'pointsBonus':
                transaction.bonusPoints = perk.pointsBonus ?? 0;
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
              .filter(
                (tier: any) => tier.pointsThreshold <= loyaltyCard!.points
              )
              .sort(
                (a: any, b: any) => b.pointsThreshold - a.pointsThreshold
              )[0];

            if (nextTier && loyaltyCard!.tierId !== nextTier.id) {
              loyaltyCard!.tierId = nextTier.id;
            }

            await updateLoyaltyCard(loyaltyCard!);
          }

          // check if customer has hit any reward milestones
          loyaltyProgram?.milestones.forEach((milestone) => {
            /*
            if (loyaltyCard!.points >= milestone.points) {
              transaction.rewardsEarned.push(milestone.reward);
            }
              */
          });

          response.status(200).send({
            message: 'Transaction completed successfully.',
            transaction: await fetchLoyaltyCardTransactionById(
              id,
              loyaltyCard!.businessId
            ),
          });
        } catch (error) {
          // somethin went wrong with the transaction so we need to rollback
          if (id) {
            // delete transaction
            await deleteLoyaltyCardTransaction(loyaltyCard.businessId, id);
          }
          response.status(500).send({ error: 'Error completing transaction.' });
        }
      });
    }
  );
});
