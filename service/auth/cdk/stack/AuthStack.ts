import {
  authFromLambda,
  grantSecretRead,
  httpApiBuilder,
  lambdaBuilder,
  tableBuilder,
} from "@dannywrayuk/cdk";
import { Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";

export class AuthStack extends Stack {
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
      environment: { USER_TABLE_NAME: userTable.tableName },
    });

    const refresh = lambda({
      name: "refresh",
      environment: { USER_TABLE_NAME: userTable.tableName },
    });

    const logout = lambda({ name: "logout" });

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
  }
}
