import {
  fetchBusinessById,
  fetchCustomerById,
  fetchLoyaltyCardByCustomerAndBusinessId,
  fetchLoyaltyCardByMembershipNumber,
  fetchLoyaltyProgramById,
} from '@src/shared/queries';
import { fetchCustomerByEmailOrPhone } from '@src/shared/queries/fetchCustomerByEmailOrPhone';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { LoyaltyCard } from '@src/domain';
import { handleRequest } from '@src/shared/helpers/handleRequest';

export const getLoyaltyCardInfo = onRequest(
  { memory: '256MiB', timeoutSeconds: 60 },
  async (req, res) => {
    handleRequest('getLoyaltYCard', req, res, ['GET'], {}, async (context) => {
      const { businessId } = context;

      const identifier = req.query.membershipId as string | undefined;
      if (!identifier) {
        res.status(400).send('Membership number is required');
        return;
      }
      let loyaltyCard: LoyaltyCard | null = null;
      // check if membershipId is a membership number
      if (identifier?.length === 11) {
        loyaltyCard = await fetchLoyaltyCardByMembershipNumber(identifier!);
      }
      if (!loyaltyCard) {
        const customer = await fetchCustomerByEmailOrPhone(identifier!);
        if (!customer) {
          res.status(404).send('Customer not found');
          return;
        }
        loyaltyCard = await fetchLoyaltyCardByCustomerAndBusinessId(
          customer.id,
          businessId!
        );
      }
      if (!loyaltyCard) {
        res.status(404).send('Loyalty card not found');
        return;
      }
      logger.info('Loyalty card found', { loyaltyCard });

      // add information about the customer, business and loyalty information to the response
      const customer = await fetchCustomerById(loyaltyCard.customerId);
      const business = await fetchBusinessById(businessId!);
      const loyaltyProgram = await fetchLoyaltyProgramById(
        loyaltyCard.loyaltyProgramId,
        businessId
      );

      res.status(200).send({
        ...loyaltyCard,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        businessName: business.name,
        loyaltyProgramName: loyaltyProgram.name,
        tierName: loyaltyProgram.tiers.find(
          (tier) => tier.id === loyaltyCard?.tierId
        )?.name,
      });
    });
  }
);
