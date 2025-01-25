import { db } from '@src/firebase';
import { beginTimedOperation } from '../helpers/beginTimedOperation';
import { LoyaltyProgram } from '@src/domain';

export const fetchLoyaltyProgramById = async (
  id: string,
  businessId: string
) => {
  return beginTimedOperation(
    'fetchLoyaltyProgramById',
    { id, businessId },
    async () => {
      const businessRef = db.collection('businesses').doc(businessId);
      if (!businessRef) {
        throw new Error(`Business with id ${businessId} not found`);
      }
      const loyaltyProgramSnapshot = await businessRef
        .collection('loyaltyPrograms')
        .doc(id)
        .get();

      return {
        ...loyaltyProgramSnapshot.data(),
        id: loyaltyProgramSnapshot.id,
        businessId: loyaltyProgramSnapshot.ref.parent.parent?.id,
      } as LoyaltyProgram;
    }
  );
};
