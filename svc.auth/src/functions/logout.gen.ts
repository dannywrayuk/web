export type LambdaEnv_dev = {
  githubUrl: string;
  githubApiUrl: string;
} & { stage: "dev" };

export type LambdaEnv_prod = {
  githubUrl: string;
  githubApiUrl: string;
} & { stage: "prod" };

export type CommonEnv = {
  stage: string;
  functionName: string;
  serviceName: string;
  authTokenTimeouts: {
    accessToken: number;
    refreshToken: number;
  };
  domainName: string;
  awsEnv: {
    account: string;
    region: string;
  };
};

export type LambdaEnv = CommonEnv & (LambdaEnv_dev | LambdaEnv_prod);

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;