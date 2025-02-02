import { aws_lambda as lambda, aws_iam as iam } from "aws-cdk-lib";

type ServiceConfig = {
  stage: string;
  awsEnv: {
    region: string;
    account: string;
  };
};

export const grantSecretRead = async (
  config: ServiceConfig,
  resources: lambda.IFunction[],
  secretNames: string[],
) => {
  const policyStatement = new iam.PolicyStatement({
    actions: ["ssm:GetParameters"],
    resources: secretNames.map(
      (secretName) =>
        `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/${secretName}`,
    ),
  });
  resources.forEach((resource) => {
    resource.addToRolePolicy(policyStatement);
  });
};
