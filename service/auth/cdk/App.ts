import {
  lambdaAuthorizer,
  grantSecretRead,
  httpApiBuilder,
  lambdaBuilder,
  tableBuilder,
} from "@dannywrayuk/cdk";
import { App, Stack, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { config, runtimeConfig } from "./config";

class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });

    const lambda = lambdaBuilder(this, {
      ...config,
      runtimeConfig,
      generateEnvTypes: true,
    });

    const api = httpApiBuilder(this, { ...config });

    const table = tableBuilder(this, { ...config });

    const userTable = table({
      name: "users",
      gsi: [{ name: "PartitionSortInverse", PK: "SK", SK: "PK" }],
    });

    const login = lambda({
      name: "login",
      timeout: Duration.seconds(10),
      environment: {
        userTableName: userTable.tableName,
      },
    });

    const refresh = lambda({
      name: "refresh",
      environment: {
        userTableName: userTable.tableName,
      },
    });

    const logout = lambda({ name: "logout" });

    const verify = lambda({ name: "verify" });
    const authorizer = lambdaAuthorizer(verify);

    const user = lambda({
      name: "user",
      environment: {
        userTableName: userTable.tableName,
      },
    });

    const deleteUser = lambda({
      name: "deleteUser",
      environment: {
        userTableName: userTable.tableName,
      },
    });

    api({
      subDomain: "auth",
      routes: {
        login: {
          GET: login,
        },
        refresh: {
          GET: refresh,
        },
        logout: {
          GET: logout,
        },
        // This should probably be its own user service, oh well its fine for now.
        user: {
          GET: user,
          delete: { GET: deleteUser },
          routeAuthorizer: authorizer,
        },
      },
    });

    grantSecretRead(
      config,
      [login, refresh, verify],
      ["AUTH_ACCESS_TOKEN_SIGNING_KEY", "AUTH_REFRESH_TOKEN_SIGNING_KEY"],
    );

    grantSecretRead(
      config,
      [login],
      ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    );

    userTable.grantReadWriteData(login);
    userTable.grantReadWriteData(refresh);
    userTable.grantReadWriteData(user);
    userTable.grantReadWriteData(deleteUser);
  }
}

const app = new App();

new AuthStack(app);
