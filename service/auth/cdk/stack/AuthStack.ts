import {
  Duration,
  Stack,
  aws_iam as iam,
  aws_dynamodb as ddb,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { httpApiBuilder } from "../lib/httpApiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";
import { tableBuilder } from "../lib/tableBuilder";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });
    const lambda = lambdaBuilder(this, { ...config });
    const api = httpApiBuilder(this, { ...config });
    const table = tableBuilder(this, { ...config });

    const userTable = table({ name: "users" });

    const verify = lambda({ name: "verify" });
    const login = lambda({
      name: "login",
      timeout: Duration.seconds(10),
      environment: { USER_TABLE_NAME: userTable.tableName },
    });

    api({
      subDomain: "auth",
      routes: {
        verify: {
          GET: verify,
        },
        login: {
          GET: login,
        },
      },
    });

    const policyStatement = new iam.PolicyStatement({
      actions: ["ssm:GetParameters"],
      resources: [
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/GITHUB_CLIENT_ID`,
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/GITHUB_CLIENT_SECRET`,
      ],
    });

    verify.addToRolePolicy(policyStatement);
    login.addToRolePolicy(policyStatement);
    userTable.grantReadWriteData(login);
  }
}
