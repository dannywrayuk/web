import {
  authFromLambda,
  configBuilder,
  grantSecretRead,
  httpApiBuilder,
  lambdaBuilder,
  tableBuilder,
} from "@dannywrayuk/cdk";
import { App, Stack, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

const app = new App();

const config = configBuilder(
  {
    name: "auth",
    domainName: "dannywray.co.uk",
    authTokenTimeouts: {
      accessToken: 60 * 60 * 6, // 6 hours
      refreshToken: 60 * 60 * 24 * 30, // 30 days
    },
  },
  {
    dev: {
      mockUrl: "mock.dannywray.co.uk/",
    },
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });
    const lambda = lambdaBuilder(this, { ...config });
    const api = httpApiBuilder(this, { ...config });
    const table = tableBuilder(this, { ...config });

    const userTable = table({ name: "users" });

    const verify = lambda({ name: "verify" });
    const authorizer = authFromLambda(verify);

    const login = lambda({
      name: "login",
      timeout: Duration.seconds(10),
      constants: {
        MOCK_URL: "mockUrl" in config && config.mockUrl,
        AUTH_TOKEN_TIMEOUTS: config.authTokenTimeouts,
      },
      environment: {
        USER_TABLE_NAME: userTable.tableName,
      },
    });

    const refresh = lambda({
      name: "refresh",
      environment: { USER_TABLE_NAME: userTable.tableName },
      constants: {
        AUTH_TOKEN_TIMEOUTS: config.authTokenTimeouts,
      },
    });

    const logout = lambda({ name: "logout" });

    const user = lambda({
      name: "user",
      environment: { USER_TABLE_NAME: userTable.tableName },
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
        user: { GET: { handler: user, authorizer } },
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
  }
}

new AuthStack(app);
