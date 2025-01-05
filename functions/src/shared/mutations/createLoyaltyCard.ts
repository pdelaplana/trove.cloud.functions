import { LoyaltyCard } from '@src/domain';
import { db } from '../../firebase';
import { generateMembershipNumber } from '../helpers/generateMembershipNumber';

export const createLoyaltyCard = async (
  customerId: string,
  businessId: string,
  loyaltyProgramId: string
) => {
  const snapshot = db.collection('loyaltyCards').get();
  const membershipNumbers = (await snapshot).docs.map(
    (doc) => (doc.data() as LoyaltyCard).membershipNumber
  );
  const reference = await db.collection('loyaltyCards').add({
    customerId,
    businessId,
    loyaltyProgramId,
    membershipNumber: generateMembershipNumber(6, new Set(membershipNumbers)),
    points: 0,
    stamps: 0,
    membershipDate: new Date(),
  } as Omit<LoyaltyCard, 'id'>);
  return reference.id;
};
