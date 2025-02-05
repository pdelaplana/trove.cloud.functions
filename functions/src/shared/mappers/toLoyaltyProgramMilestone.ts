import { LoyaltyProgramMilestone } from '@src/domain';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export const toLoyaltyProgramMilestone = (
  doc: DocumentSnapshot
): LoyaltyProgramMilestone => {
  const data = doc.data();

  return {
    ...data,
    id: doc.id,
    reward: {
      ...data?.reward,
      validUntilDate: data?.reward.validUntilDate
        ? data.reward.validUntilDate.toDate()
        : null,
    },
  } as LoyaltyProgramMilestone;
};
