import { app, Config } from "@dannywrayuk/cdk";

export const config = new Config(
  {
    name: "{{name}}",
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

app(config, () => {});
