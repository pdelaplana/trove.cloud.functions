import { CustomerReward } from '@src/domain';
import { DocumentSnapshot } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

export const toCustomerReward = (doc: DocumentSnapshot): CustomerReward => {
  const data = doc.data();
  if (!data) {
    logger.error('Customer reward data is null', data);
    throw new Error('Customer reward is null');
  }
  return {
    ...data,
    expiryDate: data?.expiryDate?.toDate() ?? null,
    id: doc.id,
    businessId: doc.ref.parent.parent?.id,
  } as CustomerReward;
};
