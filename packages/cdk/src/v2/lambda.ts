import {
  aws_lambda_nodejs as nodeLambda,
  aws_lambda as awsLambda,
  aws_logs as logs,
  RemovalPolicy,
} from "aws-cdk-lib";
import * as fs from "node:fs";
import { runtimeConfigBuilder } from "../runtimeConfigBuilder";
import { generateLambdaTypes } from "../util/generateLambdaTypes";
import { getConfig } from "./getConfig";
import { Construct } from "constructs";

type LambdaConfig = {
  name: string;
  runtimeConfig?: ReturnType<typeof runtimeConfigBuilder>;
  constants?: Record<string, string>;
  generateEnvTypes?: boolean;
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

export class Lambda extends nodeLambda.NodejsFunction {
  constructor(scope: Construct, lambdaConfig: LambdaConfig) {
    const stackConfig = getConfig(scope);
    const config = { ...stackConfig, ...lambdaConfig };
    const namespace = `${stackConfig.name}-${lambdaConfig.name}`;
    const functionName = `${namespace}-${stackConfig.stage}`;
    const entry = config.entry || findHandler(config.name);

    const constants = {
      stage: config.stage,
      ...config.runtimeConfig?.common,
      ...config.runtimeConfig?.current,
      serviceName: config.name,
      ...config.constants,
      functionName: lambdaConfig.name,
    } as const;

    super(scope, `NodejsFunction-${config.name}`, {
      architecture: awsLambda.Architecture.ARM_64,
      runtime: awsLambda.Runtime.NODEJS_22_X,
      functionName,
      entry,
      ...config,
      bundling: {
        define: { "process.env.constants": JSON.stringify(constants) },
      },
    });

    new logs.LogGroup(this, `LogGroup-${config.name}`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const generateEnvTypes =
      config.generateEnvTypes !== undefined
        ? lambdaConfig.generateEnvTypes
        : true;

    if (generateEnvTypes) {
      generateLambdaTypes({
        entry,
        stage: config.stage,
        functionName,
        serviceName: stackConfig.name,
        runtimeConfig: config.runtimeConfig,
        environment: config.environment,
      });
    }
  }
}
