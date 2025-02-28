import {
  grantSecretRead,
  httpApiBuilder,
  lambdaBuilder,
  objectRouter,
} from "@dannywrayuk/cdk";
import { App, Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CoreStack, ExternalResources } from "core/App";
import { config, runtimeConfig } from "./config";

class AuthStack extends Stack {
  constructor(scope: Construct, externalResources: ExternalResources) {
    super(scope, "AuthStack", { env: config.awsEnv });
    const { userTable } = externalResources;

    const lambda = lambdaBuilder(this, {
      ...config,
      runtimeConfig,
    });

    const api = httpApiBuilder(this, { ...config });

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

    api({
      subDomain: "auth",
      endpoints: objectRouter({
        login: {
          GET: login,
        },
        refresh: {
          GET: refresh,
        },
        logout: {
          GET: logout,
        },
      }),
    });

    grantSecretRead(
      config,
      [login, refresh],
      ["AUTH_ACCESS_TOKEN_SIGNING_KEY", "AUTH_REFRESH_TOKEN_SIGNING_KEY"],
    );

    grantSecretRead(
      config,
      [login],
      ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    );

    userTable.grantReadWriteData(login);
    userTable.grantReadWriteData(refresh);
  }
}

const app = new App();

const core = new CoreStack(app);

const auth = new AuthStack(app, core.externalResources);
auth.addDependency(core);
