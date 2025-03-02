import { configBuilder, runtimeConfigBuilder } from "@dannywrayuk/cdk";

export const config = configBuilder(
  {
    name: "user",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

export const runtimeConfig = runtimeConfigBuilder(
  {},
  {
    dev: {},
    prod: {},
  },
);
