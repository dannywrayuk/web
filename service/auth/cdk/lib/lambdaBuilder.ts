import {
  aws_lambda_nodejs as nodeLambda,
  aws_lambda as awsLambda,
  aws_logs as logs,
  Stack,
  RemovalPolicy,
} from "aws-cdk-lib";

type ServiceConfig = {
  name: string;
  stage: string;
} & nodeLambda.NodejsFunctionProps;

type LambdaConfig = {
  name: string;
} & nodeLambda.NodejsFunctionProps;

export const lambdaBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) =>
  (lambdaConfig: LambdaConfig) => {
    const namespace = `${serviceConfig.name}-${lambdaConfig.name}`;
    const functionName = `${namespace}-${serviceConfig.stage}`;

    new logs.LogGroup(stack, `${namespace}-LogGroup-${serviceConfig.stage}`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    return new nodeLambda.NodejsFunction(
      stack,
      `${namespace}-NodejsFunction-${serviceConfig.stage}`,
      {
        architecture: awsLambda.Architecture.ARM_64,
        runtime: awsLambda.Runtime.NODEJS_22_X,
        functionName,
        entry: `./src/${lambdaConfig.name}/index.ts`,
        ...serviceConfig,
        ...lambdaConfig,
        environment: {
          ...serviceConfig.environment,
          ...lambdaConfig.environment,
          SERVICE_NAME: serviceConfig.name,
          STAGE: serviceConfig.stage,
          FUNCTION_NAME: lambdaConfig.name,
          REGION: Stack.of(stack).region,
        },
      },
    );
  };
