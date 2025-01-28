import { Business, LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { generateMembershipNumber } from '../helpers/generateMembershipNumber';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { fetchCustomerById, fetchLoyaltyProgramById } from '../queries';

export const createLoyaltyCard = async (
  customerId: string,
  businessId: string,
  loyaltyProgramId: string
) => {
  return beginTimedOperation(
    'createLoyaltyCard',
    { customerId, businessId, loyaltyProgramId },
    async () => {
      const businessRef = db.collection('businesses').doc(businessId);

      const loyaltyCardsRef = businessRef.collection('loyaltyCards');

      const business = (await businessRef.get()).data() as Business;
      const loyaltyProgram = await fetchLoyaltyProgramById(
        loyaltyProgramId,
        businessId
      );
      const customer = await fetchCustomerById(customerId);

      const membershipNumbers = (await loyaltyCardsRef.get()).docs.map(
        (doc) => (doc.data() as LoyaltyCard).membershipNumber
      );

      const result = await loyaltyCardsRef.add({
        businessId,
        businessName: business.name,

        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,

        loyaltyProgramId,
        loyaltyProgramName: loyaltyProgram.name,

        membershipNumber:
          generateMembershipNumber(6, new Set(membershipNumbers)) +
          '-' +
          businessId.slice(-4).toUpperCase(), // append last four digits of the businessId
        points: 0,
        stamps: 0,
        membershipDate: new Date(),
      } as Omit<LoyaltyCard, 'id'>);

      return result.id;
    }
  );
};
