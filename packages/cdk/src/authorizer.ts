import { aws_apigatewayv2_authorizers as apiGwAuth } from "aws-cdk-lib";
import { Lambda } from "./lambda";

export const authorizer = (lambda: Lambda) => {
  const authorizerName = `LambdaAuthorizer-${lambda.construct.node.id}`;
  return new apiGwAuth.HttpLambdaAuthorizer(authorizerName, lambda.construct, {
    authorizerName,
    responseTypes: [apiGwAuth.HttpLambdaResponseType.SIMPLE],
    identitySource: ["$request.header.Cookie"],
  });
};
