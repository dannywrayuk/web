import { Stack as AwsStack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Config } from "./config.ts";

export class Stack extends AwsStack {
  constructor(scope: Construct, config: Config<{ name: string }, any>) {
    scope.node.setContext("stackConfig", config.current);
    super(scope, `${config.current.name}-${config.current.stage}`, {
      env: {
        account: config.current.awsEnv.account || "placeholder",
        region: config.current.awsEnv.region || "placeholder",
      },
    });
  }
}
