import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { httpApiBuilder } from "../lib/httpApiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack", { env: config.awsEnv });
    const lambda = lambdaBuilder(this, { ...config });
    const api = httpApiBuilder(this, { ...config });

    api({
      subDomain: "auth",
      routes: {
        verify: {
          GET: lambda({ name: "verify" }),
        },
      },
    });
  }
}
