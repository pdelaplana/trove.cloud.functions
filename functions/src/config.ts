import dotenv from 'dotenv';
import path from 'path';

// Define environment type
type NodeEnv = 'development' | 'production' | 'test';

type Config = {
  ENVIRONMENT: NodeEnv;
  ENCRYPTION_SECRET: string;
};
export const useConfig = (): Config => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as NodeEnv;

  switch (nodeEnv) {
    case 'development':
      dotenv.config({
        path: path.resolve(process.cwd(), '.env.development.local'),
      });
      break;
    case 'production':
      dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
      break;
    case 'test':
      dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
      break;
    default:
      throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }
  const result = dotenv.config({
    path: path.resolve(process.cwd(), '.env.development.local'),
  });

  result.parsed && Object.assign(process.env, result.parsed);

  return {
    ENVIRONMENT: nodeEnv,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET ?? '',
  };
};
