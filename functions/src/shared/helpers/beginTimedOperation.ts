import { logger } from 'firebase-functions/v2';

export async function beginTimedOperation<T>(
  name: string,
  context: Record<string, any> = {},
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  logger.info(`${name} - start`, context);

  try {
    const result = await fn();
    return result;
  } finally {
    const duration = performance.now() - startTime;
    logger.info(`${name} - end`, {
      ...context,
      durationMs: duration.toFixed(2),
    });
  }
}
