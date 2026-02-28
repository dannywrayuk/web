// This file is auto-generated. Do not edit.

export type Env_dev = {
  githubUrl: string;
  githubApiUrl: string;
  allowedOrigins: (string)[];
} & { stage: "dev" };

export type Env_prod = {
  githubUrl: string;
  githubApiUrl: string;
  removeStageSubdomain: boolean;
  deletionProtection: boolean;
  allowedOrigins: (string)[];
} & { stage: "prod" };

export type CommonEnv = {
  name: string;
  domainName: string;
  authTokenTimeouts: {
    accessToken: number;
    refreshToken: number;
  };
  awsEnv: {
    account: string;
    region: string;
  };
  stage: string;
};

export type Env = CommonEnv & (Env_dev | Env_prod);
