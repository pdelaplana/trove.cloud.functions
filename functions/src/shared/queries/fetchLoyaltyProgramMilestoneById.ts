import { db } from '@src/firebase';
import { toLoyaltyProgramMilestone } from '../mappers/toLoyaltyProgramMilestone';

export const fetchLoyaltyProgramMilestoneById = async (
  id: string,
  loyaltyProgramId: string,
  businessId: string
) => {
  const businessRef = db.collection('businesses').doc(businessId);
  if (!businessRef) {
    throw new Error(`Business with id ${businessId} not found`);
  }
  const loyaltyProgramRef = businessRef
    .collection('loyaltyPrograms')
    .doc(loyaltyProgramId);
  if (!loyaltyProgramRef) {
    throw new Error(`Loyalty program with id ${loyaltyProgramId} not found`);
  }
  const milestoneRewardSnapshot = await loyaltyProgramRef
    .collection('milestoneRewards')
    .doc(id)
    .get();
  return toLoyaltyProgramMilestone(milestoneRewardSnapshot);
};
