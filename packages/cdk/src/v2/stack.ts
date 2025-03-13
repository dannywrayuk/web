import { Stack as AwsStack } from "aws-cdk-lib";
import { Construct } from "constructs";

type StackConfig = {
  name: string;
  stage: string;
  awsEnv: { account: string; region: string };
};

export class Stack extends AwsStack {
  constructor(scope: Construct, config: StackConfig) {
    scope.node.setContext("stackConfig", config);
    super(scope, `${config.name}-${config.stage}`, { env: config.awsEnv });
  }
}
