import { defineSecret, defineString } from 'firebase-functions/params';

// Define environment type
type NodeEnv = 'development' | 'production' | 'test';

// Define Firebase config parameters

export const config = {
  environment: {
    name: defineString('ENVIRONMENT_NAME', {
      default: 'development',
    }),
  },
  encryption: {
    secret: defineSecret('ENCRYPTION_SECRET'),
  },
};

export type Config = {
  ENVIRONMENT: NodeEnv;
  ENCRYPTION_SECRET: string;
};

export const useConfig = (): Config => {
  return {
    //ENVIRONMENT: config.environment.name.value() as NodeEnv,
    //ENCRYPTION_SECRET: config.encryption.secret.value(),
    ENVIRONMENT: process.env.ENVIRONMENT_NAME as NodeEnv,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET as string,
  };
};
