import { configBuilder, httpApiBuilder, lambdaBuilder } from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";

const app = new App();

const config = configBuilder(
  {
    name: "mock",
    domainName: "dannywray.co.uk",
  },
  {
    // This service is for development purposes only.
    dev: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

class MockStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "MockStack", { env: config.awsEnv });
    const api = httpApiBuilder(this, { ...config });
    const lambda = lambdaBuilder(this, { ...config });
    api({
      subDomain: "mock",
      routes: {
        "{mockName+}": {
          ANY: lambda({ name: "responder" }),
        },
      },
    });
  }
}

new MockStack(app);
