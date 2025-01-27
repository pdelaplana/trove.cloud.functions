import { CustomerReward } from '@src/domain';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export const toCustomerReward = (doc: DocumentSnapshot): CustomerReward => {
  const data = doc.data();

  return {
    ...data,
    expiryDate: data?.expiryDate.toDate(),
    validUntilDate: data?.validUntilDate.toDate(),
    id: doc.id,
    businessId: doc.ref.parent.parent?.id,
  } as CustomerReward;
};
