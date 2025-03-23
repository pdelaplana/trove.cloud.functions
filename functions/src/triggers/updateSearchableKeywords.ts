import { db } from '@src/firebase';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

export const updateSearchableKeywords = onDocumentWritten(
  'businesses/{businessId}/loyaltyCards/{loyaltyCardId}',
  async (event) => {
    try {
      if (!event.data) {
        throw new Error('Event data is undefined');
      }
      const afterData = event.data.after.data();
      const businessId = event.params.businessId;
      const loyaltyCardId = event.params.loyaltyCardId;

      let keywords = [
        ...(afterData?.membershipNumber?.toLowerCase().split(' ') ?? []),
        ...(afterData?.customerName?.toLowerCase().split(' ') ?? []),
        ...(afterData?.customerEmail?.toLowerCase().split(' ') ?? []),
        ...(afterData?.customerPhone?.toLowerCase().split(' ') ?? []),
      ];
      keywords = keywords.filter((keyword) => keyword.length > 0);
      keywords = [...new Set(keywords)];

      // Also add partial matches for each word (prefixes)
      // This helps with "starts with" type searches
      const prefixKeywords: string[] = [];
      keywords.forEach((keyword) => {
        // Only generate prefixes for words longer than 3 characters
        if (keyword.length > 3) {
          // Generate prefixes of length 3 and longer
          for (let i = 3; i < keyword.length; i++) {
            prefixKeywords.push(keyword.substring(0, i));
          }
        }
      });

      keywords = [...keywords, ...prefixKeywords];
      keywords = [...new Set(keywords)];

      console.log(
        `Generated ${keywords.length} search keywords for customer: ${afterData?.customerName}`
      );

      const loyaltyCard = await db
        .collection('businesses')
        .doc(businessId)
        .collection('loyaltyCards')
        .doc(loyaltyCardId)
        .get();

      loyaltyCard.ref.update({
        keywords,
        updatedAt: new Date(),
      });

      logger.info('Keywords updated successfully', { businessId });
    } catch (error) {
      logger.error('Error updating keywords', { error });
      throw error;
    }
  }
);
