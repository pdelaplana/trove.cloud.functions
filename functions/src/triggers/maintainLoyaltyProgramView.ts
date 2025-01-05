import * as functions from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '@src/firebase';
import { LoyaltyProgram } from '@src/domain';

export const maintainLoyaltyProgramView = onDocumentUpdated(
  'businesses/{businessId}',
  async (event) => {
    try {
      if (!event.data) {
        throw new Error('Event data is undefined');
      }
      const afterData = event.data.after.data();
      const businessId = event.params.businessId;

      // Delete old view entries
      const batch = db.batch();
      const oldViewDocs = await db
        .collection('loyaltyProgramsView')
        .where('businessId', '==', businessId)
        .get();

      oldViewDocs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // Create new view entries if business exists
      if (afterData) {
        const newBatch = db.batch();
        afterData.loyaltyPrograms?.forEach((program: LoyaltyProgram) => {
          const viewRef = db.collection('loyaltyProgramsView').doc();
          newBatch.set(viewRef, {
            ...program,
            businessId,
            businessName: afterData.name,
            updatedAt: new Date(),
          });
        });
        await newBatch.commit();
      }

      functions.logger.info('View maintained successfully', { businessId });
    } catch (error) {
      functions.logger.error('Error maintaining view', { error });
      throw error;
    }
  }
);
