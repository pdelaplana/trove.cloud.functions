import { logger } from 'firebase-functions/v2';
import cors from 'cors';
import { allowedMethods } from './allowedMethods';
import { beginTimedOperation } from './beginTimedOperation';
import { runWithAuthentication } from './runWithAuthentication';
import { validateParams } from './validateParams';

export async function handleRequest<T>(
  name: string,
  request: any,
  response: any,
  methods: string[] = ['GET', 'POST'],
  params: string[] = [],
  context: Record<string, any> = {},
  fn: (context: Record<string, any>) => Promise<T>
) {
  cors({ origin: true })(request, response, async () => {
    allowedMethods(request, response, methods);

    beginTimedOperation(name, context, async () => {
      runWithAuthentication(request, response, async (context) => {
        try {
          const validation = validateParams(request, params);
          if (!validation.isValid) {
            response.status(400).send({
              error: 'Missing required fields.',
              fields: validation.missingFields,
            });
            return;
          }
          context = { ...context, params: validation.values };

          const result = await fn(context);
          return result;
        } catch (error) {
          logger.error('Internal server error', { error });
          response.status(500).send({ error: 'Internal server error' });
          return null;
        }
      });
    });
  });
}

export async function handleUnauthenticatedRequest<T>(
  name: string,
  request: any,
  response: any,
  methods: string[] = ['GET', 'POST'],
  params: string[] = [],
  context: Record<string, any> = {},
  fn: (context: Record<string, any>) => Promise<T>
) {
  cors({ origin: true })(request, response, async () => {
    allowedMethods(request, response, methods);

    beginTimedOperation(name, context, async () => {
      try {
        const validation = validateParams(request, params);
        if (!validation.isValid) {
          response.status(400).send({
            error: 'Missing required fields.',
            fields: validation.missingFields,
          });
          return;
        }

        context = { ...context, params: validation.values };

        const result = await fn(context);
        return result;
      } catch (error) {
        logger.error('Internal server error', { error });
        response.status(500).send({ error: 'Internal server error' });
        return null;
      }
    });
  });
}
