import { readSecret } from "@dannywrayuk/aws/readSecret";

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

console.log(env)
export const getSecrets = () => readSecret(
    { stage: env.stage as string })(
    ["AUTH_ACCESS_TOKEN_SIGNING_KEY"] as const,
  );