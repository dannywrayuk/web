import {
  Stack,
  aws_lambda_nodejs as nodeLambda,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack");

    const myFunction = new nodeLambda.NodejsFunction(
      this,
      "HelloWorldFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X, // Provide any supported Node.js runtime
        entry: "./src/helloWorld/helloWorld.handler.ts",
      },
    );
  }
}
