import { Duration, Stack, aws_iam as iam } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { httpApiBuilder } from "../lib/httpApiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";
import { tableBuilder } from "../lib/tableBuilder";
import { authFromLambda } from "../lib/authFromLambda";

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

    const policyStatement = new iam.PolicyStatement({
      actions: ["ssm:GetParameters"],
      resources: [
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/GITHUB_CLIENT_ID`,
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/GITHUB_CLIENT_SECRET`,
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/AUTH_ACCESS_TOKEN_SIGNING_KEY`,
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/AUTH_REFRESH_TOKEN_SIGNING_KEY`,
      ],
    });

    verify.addToRolePolicy(policyStatement);
    login.addToRolePolicy(policyStatement);
    refresh.addToRolePolicy(policyStatement);
    userTable.grantReadWriteData(login);
    userTable.grantReadWriteData(refresh);
  }
}
