// This file is auto-generated. Do not edit.

export type Env_dev = {} & { stage: "dev" };

export type Env_prod = {} & { stage: "prod" };

export type CommonEnv = {
  name: string;
  domainName: string;
  awsEnv: {
    account: string;
    region: string;
  };
  stage: string;
};

export type Env = CommonEnv & (Env_dev | Env_prod);
