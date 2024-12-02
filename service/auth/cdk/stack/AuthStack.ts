import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import config from "../config";
import { apiBuilder } from "../lib/apiBuilder";
import { lambdaBuilder } from "../lib/lambdaBuilder";

export class AuthStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "AuthStack");
    const lambda = lambdaBuilder(this, { ...config });
    const api = apiBuilder(this, { ...config });

    const verify = lambda({ name: "helloWorld" });
    const authApi = api({
      name: "auth",
      resources: {
        "user/{userId}": {
          auth: {
            all: { GET: verify },
            "{rewardId}": {
              GET: verify,
              sdf: { POST: verify },
            },
          },
          "user/login": { GET: { handler: verify } },
        },
      },
    });
  }
}
