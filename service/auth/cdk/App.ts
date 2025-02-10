import {
  lambdaAuthorizer,
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
      githubUrl: "https://mock.dannywray.co.uk/github.com",
      githubApiUrl: "https://mock.dannywray.co.uk/api.github.com",
    },
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
      githubUrl: "https://github.com",
      githubApiUrl: "https://api.github.com",
    },
  },
);

class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });

    const lambda = lambdaBuilder(this, {
      ...config,
      generateEnvTypes: true,
    });

    const api = httpApiBuilder(this, { ...config });

    const table = tableBuilder(this, { ...config });

    const userTable = table({ name: "users" });

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
        user: {
          GET: { handler: user, authorizer },
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
  }
}

new AuthStack(app);
