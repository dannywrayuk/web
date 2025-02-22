import { tableBuilder, httpApiBuilder, fsRouter } from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { config, runtimeConfig } from "./config";

class UserStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "UserStack", { env: config.awsEnv });
    const api = httpApiBuilder(this, { ...config });

    const table = tableBuilder(this, { ...config });

    const userTable = table({
      name: "users",
      gsi: [{ name: "PartitionSortInverse", PK: "SK", SK: "PK" }],
    });

    const routes = fsRouter(this, { ...config });

    api({
      subDomain: "user",
      routes,
    });
  }
}

const app = new App();

new UserStack(app);
