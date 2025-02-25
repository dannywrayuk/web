import { fsRouter, httpApiBuilder, tableBuilder } from "@dannywrayuk/cdk";
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

    const { endpoints } = api({
      subDomain: "user",
      endpoints: fsRouter(this, {
        ...config,
        runtimeConfig,
        environment: { userTableName: userTable.tableName },
      }),
    });

    endpoints.forEach((endpoint) => {
      userTable.grantReadWriteData(endpoint.handler);
    });
  }
}

const app = new App();

new UserStack(app);
