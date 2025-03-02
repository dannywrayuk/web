import { bucketBuilder, configBuilder } from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";

export const config = configBuilder(
  {
    name: "auth-ui",
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

class AuthUIStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthUIStack", { env: config.awsEnv });
    const bucket = bucketBuilder(this, {
      ...config,
    });

    bucket({ name: "assets" });
  }
}

const app = new App();

new AuthUIStack(app);
