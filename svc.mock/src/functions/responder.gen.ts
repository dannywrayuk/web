export type CommonEnv = {
  stage: string;
  functionName: string;
  serviceName: string;
};

export type LambdaEnv = CommonEnv & ({});

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;