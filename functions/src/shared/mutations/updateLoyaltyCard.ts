import { Business, LoyaltyCard } from '@src/domain';
import { db } from '@src/firebase';
import { fetchCustomerById, fetchLoyaltyProgramById } from '../queries';

export const updateLoyaltyCard = async (loyaltyCard: LoyaltyCard) => {
  const { id, businessId, ...loyaltyCardWithoutId } = loyaltyCard;

  const businessRef = db.collection('businesses').doc(businessId);
  const loyaltyCardsRef = businessRef.collection('loyaltyCards').doc(id);

  if (!loyaltyCardsRef) {
    throw new Error(`Loyalty card with id ${loyaltyCard.id} not found`);
  }

  // get latest business, loyalty program and customer data to update loyalty card
  const business = (await businessRef.get()).data() as Business;
  const loyaltyProgram = await fetchLoyaltyProgramById(
    loyaltyCard.loyaltyProgramId,
    businessId
  );
  const customer = await fetchCustomerById(loyaltyCard.customerId);

  if (!business || !loyaltyProgram || !customer) {
    throw new Error('Business, loyalty program or customer not found');
  }

  await loyaltyCardsRef.set(
    {
      ...loyaltyCardWithoutId,
      businessName: business.name,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      tierName: loyaltyCard.tierId
        ? loyaltyProgram.tiers.find((tier) => tier.id === loyaltyCard.tierId)
            ?.name
        : '',
      loyaltyProgramName: loyaltyProgram.name,
    },
    { merge: true }
  );
};
