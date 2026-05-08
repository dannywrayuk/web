import { Config } from "@dannywrayuk/cdk";

export const serviceName = "user";

export const config = new Config({
  "*": {
    name: serviceName,
    domainName: "dannywray.co.uk",
  },
  dev: {},
  prod: {},
});
