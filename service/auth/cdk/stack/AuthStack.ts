import { Stack, aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack");

    const myFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_20_X, // Provide any supported Node.js runtime
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            body: JSON.stringify('Hello CDK!'),
          };
        };
      `),
    });
  }
}
