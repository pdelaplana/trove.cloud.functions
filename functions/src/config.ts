// Define environment type
type NodeEnv = 'development' | 'production' | 'test';

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
