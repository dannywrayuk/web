import { Stack, aws_iam as iam } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { httpApiBuilder } from "../lib/httpApiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });
    const lambda = lambdaBuilder(this, { ...config });
    const api = httpApiBuilder(this, { ...config });
    const verify = lambda({ name: "verify" });
    api({
      subDomain: "auth",
      routes: {
        verify: {
          GET: verify,
        },
      },
    });

    const policyStatement = new iam.PolicyStatement({
      actions: ["ssm:GetParameters"],
      resources: [
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/yes`,
      ],
    });

    verify.addToRolePolicy(policyStatement);
  }
}
