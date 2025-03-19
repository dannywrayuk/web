import {
  aws_lambda as awsLambda,
  Duration,
  aws_iam as iam,
  aws_logs as logs,
  aws_lambda_nodejs as nodeLambda,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "node:fs";
import { Config } from "./config";
import { getStackConfig } from "./getStackConfig";
import { generateLambdaTypes } from "./util/generateLambdaTypes";

type LambdaConfig = {
  name: string;
  runtimeConfig?: Config<any, any>;
  constants?: Record<string, string>;
  generateEnvTypes?: boolean;
  timeout?: number | Duration;
} & Omit<nodeLambda.NodejsFunctionProps, "timeout">;

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
    const stackConfig = getStackConfig(scope);
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
      timeout:
        typeof config.timeout === "number"
          ? Duration.seconds(config.timeout)
          : config.timeout,
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

  grantSecretRead(secretNames: string[]) {
    const config = getStackConfig(this);
    this.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: secretNames.map(
          (secretName) =>
            `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/${secretName}`,
        ),
      }),
    );
  }
}
