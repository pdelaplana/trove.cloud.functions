import { logger } from 'firebase-functions/v2';
import { DomainEvent } from './domain/events/domainEvent';
import {
  RewardClaimedEvent,
  RewardClaimFailedEvent,
  RewardRedemptionEvent,
} from './domain/events/rewardEvents';
import {
  addCustomerReward,
  addLoyaltyCardTransaction,
  deleteLoyaltyCardTransaction,
  updateCustomerReward,
  updateLoyaltyCard,
} from './shared/mutations';
import { LoyaltyPointsEarnedEvent } from './domain/events/earnEvents';
import {
  EventBus,
  HandlerEntry,
  HandlerResult,
} from './domain/events/eventBus';
import { CustomerEnrolledEvent } from './domain/events/customerEnrollmentEvents';
import { addLoyaltyCard } from './shared/mutations/addLoyaltyCard';

export function createFirebaseEventBus(): EventBus {
  const handlers = new Map<string, Array<HandlerEntry>>();

  async function publish(
    event: DomainEvent
  ): Promise<Map<string, HandlerResult>> {
    const eventHandlers = handlers.get(event.type) || [];
    const resultMap = new Map<string, HandlerResult>();

    try {
      const results = await Promise.all(
        eventHandlers.map(async ({ handler, id }) => {
          try {
            const result = (await handler(event)) as HandlerResult;
            return { id, result };
          } catch (error) {
            logger.error('Handler error', {
              error,
              eventType: event.type,
              handlerId: id,
            });
            throw error;
          }
        })
      );

      // Populate the result map
      results.forEach(({ id, result }) => {
        resultMap.set(id, result);
      });

      logger.info('Domain event published', {
        results: Object.fromEntries(resultMap),
        type: event.type,
      });

      return resultMap;
    } catch (error) {
      logger.error('Event publishing failed', {
        error,
        type: event.type,
      });
      throw error;
    }
  }

  function publishAll(
    events: DomainEvent[]
  ): Promise<Map<string, HandlerResult>[]> {
    return Promise.all(events.map(async (event) => await publish(event)));
  }

  function subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: (event: T) => Promise<HandlerResult>,
    handlerId: string = ''
  ): void {
    if (!eventType) {
      throw new Error('Event type is required');
    }
    if (!handlerId) {
      handlerId = eventType;
    }

    const eventHandlers = handlers.get(eventType) || [];

    // Check for duplicate handler IDs
    if (eventHandlers.some((h) => h.id === handlerId)) {
      throw new Error(
        `Handler with ID ${handlerId} already exists for event type ${eventType}`
      );
    }

    handlers.set(eventType, [
      ...eventHandlers,
      {
        handler: handler as <T extends HandlerResult>(
          event: DomainEvent
        ) => Promise<T>,
        id: handlerId,
      },
    ]);
  }

  function unsubscribe<T extends DomainEvent>(
    eventType: T['type'],
    handlerId: string
  ): void {
    const eventHandlers = handlers.get(eventType) || [];
    const filteredHandlers = eventHandlers.filter((h) => h.id !== handlerId);
    handlers.set(eventType, filteredHandlers);
  }

  return {
    publish,
    publishAll,
    subscribe,
    unsubscribe,
  };
}

export const setupRewardEventHandlers = (eventBus: EventBus) => {
  // Handle reward claimed
  eventBus.subscribe<RewardClaimedEvent>('RewardClaimed', async (event) => {
    const { customerReward, loyaltyCardTransaction, loyaltyCard } =
      event.payload;

    let transactionId: string | null = null;
    try {
      // Add reward to database
      const rewardId = await addCustomerReward(customerReward);

      if (rewardId) {
        // Add transaction
        transactionId = await addLoyaltyCardTransaction(loyaltyCardTransaction);

        if (transactionId) {
          await updateLoyaltyCard(loyaltyCard);
        }
      }
      return { data: { rewardId, transactionId } };
    } catch (error) {
      if (transactionId) {
        // Rollback transaction
        await deleteLoyaltyCardTransaction(
          loyaltyCard.businessId,
          transactionId
        );
      }
      logger.error('Error processing reward claimed event', error);
      throw error;
    }
  });

  // Handle reward claim failed
  eventBus.subscribe<RewardClaimFailedEvent>(
    'RewardClaimFailed',
    async (event) => {
      logger.error('Reward claim failed', event.payload.error);
      return {
        data: { error: event.payload.error },
      };
      // Additional error handling logic
    }
  );

  // Handle reward redemptions
  eventBus.subscribe<RewardRedemptionEvent>(
    'RewardRedemption',
    async (event) => {
      const { customerReward, loyaltyCardTransaction, loyaltyCard } =
        event.payload;
      let transactionId: string | null = null;
      try {
        transactionId = await addLoyaltyCardTransaction(loyaltyCardTransaction);

        if (transactionId) {
          // Update reward in database
          await updateCustomerReward(customerReward);
          await updateLoyaltyCard(loyaltyCard);
        }

        return { data: { transactionId } };
      } catch (error) {
        if (transactionId) {
          // Rollback transaction
          await deleteLoyaltyCardTransaction(
            loyaltyCard.businessId,
            transactionId
          );
        }
        logger.error('Error processing reward claimed event', error);
        throw error;
      }
    }
  );

  // Handle other events here
};

export const setupPointsEarnedEventHandlers = (eventBus: EventBus) => {
  eventBus.subscribe<LoyaltyPointsEarnedEvent>(
    'LoyaltyPointsEarned',
    async (event) => {
      try {
        const { loyaltyCardTransaction, loyaltyCard } = event.payload;
        const id = await addLoyaltyCardTransaction(loyaltyCardTransaction);
        if (id) await updateLoyaltyCard(loyaltyCard);
        return { data: { transactionId: id } };
      } catch (error) {
        logger.error('Error processing points earned event', error);
        throw error;
      }
    }
  );
};

export const setupCustomerEnrolledHandlers = (eventBus: EventBus) => {
  eventBus.subscribe<CustomerEnrolledEvent>(
    'CustomerEnrolled',
    async (event) => {
      try {
        const { loyaltyCard } = event.payload;

        const id = await addLoyaltyCard(loyaltyCard);
        return { data: { loyaltyCardId: id } };
      } catch (error) {
        logger.error('Error processing points earned event', error);
        throw error;
      }
    }
  );
};
