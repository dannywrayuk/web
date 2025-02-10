import {
  aws_lambda_nodejs as nodeLambda,
  aws_lambda as awsLambda,
  aws_logs as logs,
  Stack,
  RemovalPolicy,
} from "aws-cdk-lib";
import * as fs from "node:fs";
import { variableToTypeString } from "./util/variableToTypeString";

type ServiceConfig = {
  name: string;
  stage: string;
  runtimeConfig?: Record<string, any>;
  generateEnvTypes?: boolean;
} & nodeLambda.NodejsFunctionProps;

type LambdaConfig = {
  name: string;
  generateEnvTypes?: boolean;
  constants?: Record<string, any>;
} & nodeLambda.NodejsFunctionProps;

const findHandler = (handlerName: string) => {
  const basePath = `./src/functions/${handlerName}`;
  if (fs.existsSync(`${basePath}/handler.ts`)) {
    return `${basePath}/handler.ts`;
  }
  if (fs.existsSync(`${basePath}/${handlerName}.ts`)) {
    return `${basePath}/${handlerName}.ts`;
  }
  return `${basePath}.ts`;
};

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

    const environment = {
      ...serviceConfig.environment,
      ...lambdaConfig.environment,
    } as const;

    const constants = {
      ...serviceConfig.runtimeConfig,
      serviceName: serviceConfig.name,
      ...lambdaConfig.constants,
      functionName: lambdaConfig.name,
    } as const;

    const generateEnvTypes =
      lambdaConfig.generateEnvTypes !== undefined
        ? lambdaConfig.generateEnvTypes
        : serviceConfig.generateEnvTypes !== undefined
          ? serviceConfig.generateEnvTypes
          : true;

    if (generateEnvTypes) {
      const envTypeDef = `export const env = {
    ...process.env,
    ...(process.env.constants as unknown as object)
} as unknown as ${variableToTypeString(
        { ...constants, ...environment },
        {
          humanReadable: true,
        },
      )};

export type LambdaEnv = typeof env;
`;
      const basePath = `./src/functions/${lambdaConfig.name}`;
      if (fs.existsSync(`${basePath}/`)) {
        fs.writeFileSync(`${basePath}/env.gen.ts`, envTypeDef);
      } else {
        fs.writeFileSync(`${basePath}-env.gen.ts`, envTypeDef);
      }
    }

    const entry = findHandler(lambdaConfig.name);

    return new nodeLambda.NodejsFunction(
      stack,
      `${namespace}-NodejsFunction-${serviceConfig.stage}`,
      {
        architecture: awsLambda.Architecture.ARM_64,
        runtime: awsLambda.Runtime.NODEJS_22_X,
        functionName,
        entry,
        ...serviceConfig,
        ...lambdaConfig,
        environment,
        bundling: {
          define: { "process.env.constants": JSON.stringify(constants) },
        },
      },
    );
  };
