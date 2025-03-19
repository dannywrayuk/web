import { Api, Config, Lambda, Stack, StackReference } from "@dannywrayuk/cdk";
import { App } from "aws-cdk-lib";
import { Construct } from "constructs";

const config = new Config(
  {
    name: "auth",
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

class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, config);
    const coreStack = new StackReference(this, {
      fromStack: "CoreStack",
      fromStage: null,
    });
    const userTable = coreStack.table("userTable");

    const lambdaSharedConfig = {
      environment: {
        userTableName: userTable.tableName,
      },
    };
    const login = new Lambda(this, {
      ...lambdaSharedConfig,
      name: "login",
      timeout: 10,
    });
    const refresh = new Lambda(this, {
      ...lambdaSharedConfig,
      name: "refresh",
    });
    const logout = new Lambda(this, {
      ...lambdaSharedConfig,
      name: "logout",
    });

    // userTable.grantReadWriteData(login);
    // userTable.grantReadWriteData(refresh);
    login.grantSecretRead([
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
      "AUTH_ACCESS_TOKEN_SIGNING_KEY",
      "AUTH_REFRESH_TOKEN_SIGNING_KEY",
    ]);
    refresh.grantSecretRead([
      "AUTH_ACCESS_TOKEN_SIGNING_KEY",
      "AUTH_REFRESH_TOKEN_SIGNING_KEY",
    ]);

    new Api(this, {
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
  }
}

const app = new App();

new AuthStack(app);
