import {
  aws_apigatewayv2_authorizers as apiGwAuth,
  aws_lambda as lambda,
} from "aws-cdk-lib";

export const authorizer = (lambdaFunction: lambda.IFunction) => {
  const authorizerName = `LambdaAuthorizer-${lambdaFunction.node.id}`;
  return new apiGwAuth.HttpLambdaAuthorizer(authorizerName, lambdaFunction, {
    authorizerName,
    responseTypes: [apiGwAuth.HttpLambdaResponseType.SIMPLE],
    identitySource: ["$request.header.Cookie"],
  });
};
