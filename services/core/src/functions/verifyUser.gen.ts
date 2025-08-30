import { readSecret } from "@dannywrayuk/aws/readSecret";

export type CommonEnv = {
  stage: string;
  functionName: string;
  serviceName: string;
};

export type LambdaEnv = CommonEnv & ({});

export const getSecrets = () => readSecret(
    { stage: process.env.stage as string })(
    ["AUTH_ACCESS_TOKEN_SIGNING_KEY"] as const,
  );