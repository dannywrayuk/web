import {
  fsRouter,
  httpApiBuilder,
  lambdaAuthorizer,
  sharedResourcesBuilder,
} from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { config, runtimeConfig } from "./config";

class UserStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "UserStack", { env: config.awsEnv });
    const api = httpApiBuilder(this, { ...config });
    const coreStack = sharedResourcesBuilder(this, {
      ...config,
      fromStack: "CoreStack",
    });

    const userTable = coreStack.import.table("userTable");
    const userAuthorizer = lambdaAuthorizer(
      coreStack.import.lambda("verifyUser"),
    );

    const { endpoints } = api({
      subDomain: "api",
      basePath: "user",
      defaultAuthorizer: userAuthorizer,
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
