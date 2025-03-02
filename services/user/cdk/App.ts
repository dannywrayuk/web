import {
  fsRouter,
  lambdaAuthorizer,
  sharedResourcesBuilder,
  addHttpApiEndpoints,
} from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { config, runtimeConfig } from "./config";

class UserStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "UserStack", { env: config.awsEnv });
    const coreStack = sharedResourcesBuilder(this, {
      ...config,
      fromStack: "CoreStack",
    });

    const userTable = coreStack.import.table("userTable");
    const userAuthorizer = lambdaAuthorizer(
      coreStack.import.lambda("verifyUser"),
    );

    const coreApi = coreStack.import.httpApi("coreApi");
    const endpoints = fsRouter(this, {
      ...config,
      runtimeConfig,
      defaultAuthorizer: userAuthorizer,
      environment: {
        userTableName: userTable.tableName,
      },
    });

    addHttpApiEndpoints(this, coreApi, endpoints);

    endpoints.forEach((endpoint) => {
      userTable.grantReadWriteData(endpoint.handler);
    });
  }
}

const app = new App();

new UserStack(app);
