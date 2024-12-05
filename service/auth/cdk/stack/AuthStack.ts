import { Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { httpApiBuilder } from "../lib/httpApiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack");
    const lambda = lambdaBuilder(this, { ...config });
    const api = httpApiBuilder(this, { ...config });

    const verify = lambda({ name: "helloWorld" });
    const authApi = api({
      name: "auth",
      routes: {
        "user/{userId}": {
          auth: {
            all: { GET: { handler: verify, timeout: Duration.seconds(10) } },
            "{rewardId}": {
              GET: verify,
              sdf: { POST: verify },
            },
          },
        },
        "user/login": { GET: { handler: verify } },
      },
    });
  }
}
