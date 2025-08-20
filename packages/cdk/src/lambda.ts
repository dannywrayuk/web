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
import { Table } from "./table";
import { authorizer } from "./authorizer";
import { exportName } from "./util/exportName";
import path from "node:path";
import {
  generateTableReadFunctions,
  generateTableWriteFunctions,
} from "./util/generateTableFunctions";
import { removeDuplicateImports } from "./util/removeDuplicateImports";
import { generateSecretFunctions } from "./util/generateSecretFunctions";
import { safe } from "./util/safe/safe";

export type LambdaConfig = {
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

export class Lambda {
  public construct: awsLambda.IFunction;
  public typeName = "Lambda";
  public name: string;
  public entry: string;

  constructor();
  constructor(scope: Construct, config: LambdaConfig);
  constructor(scope?: Construct, config?: LambdaConfig) {
    if (!scope || !config) {
      return;
    }
    this.name = config.name;
    const stackConfig = getStackConfig(scope);
    const namespace = `${stackConfig.name}-${config.name}`;
    const functionName = `${namespace}-${stackConfig.stage}`;
    this.entry = config.entry || findHandler(config.name);

    const constants = {
      stage: stackConfig.stage,
      ...config.runtimeConfig?.common,
      ...config.runtimeConfig?.current,
      serviceName: config.name,
      ...config.constants,
      functionName: config.name,
    } as const;

    this.construct = new nodeLambda.NodejsFunction(
      scope,
      `NodejsFunction-${config.name}`,
      {
        architecture: awsLambda.Architecture.ARM_64,
        runtime: awsLambda.Runtime.NODEJS_22_X,
        functionName,
        entry: this.entry,
        ...config,
        timeout:
          typeof config.timeout === "number"
            ? Duration.seconds(config.timeout)
            : config.timeout,
        bundling: {
          define: { "process.env.constants": JSON.stringify(constants) },
        },
      },
    );

    new logs.LogGroup(this.construct, `LogGroup-${config.name}`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.appendToCodeGen(
      generateLambdaTypes({
        stage: stackConfig.stage,
        functionName,
        serviceName: stackConfig.name,
        runtimeConfig: config.runtimeConfig,
        environment: config.environment,
      }),
    );
  }

  export(referenceName?: string) {
    const currentStack = this.construct.stack;
    currentStack.exportValue(this.construct.functionArn, {
      name: exportName({
        stackName: currentStack.stackName,
        referenceName: referenceName || this.name,
        type: this.typeName,
      }),
    });
  }

  asAuthorizer() {
    return authorizer(this);
  }

  from(construct: awsLambda.IFunction) {
    if (!this.name) {
      this.name = construct.functionName;
    }
    this.construct = construct;
    return this;
  }
  fromArn(
    scope: Construct,
    id: string,
    referenceValue: string,
    referenceName: string,
  ) {
    this.name = referenceName;
    return this.from(
      nodeLambda.NodejsFunction.fromFunctionArn(scope, id, referenceValue),
    );
  }

  appendToCodeGen(str: string) {
    const entryPath = path.parse(this.entry);
    const contentRead = safe(fs.readFileSync)(
      `${entryPath.dir}/${entryPath.name}.gen.ts`,
    );
    const content = contentRead.error ? "" : contentRead.result.toString();
    const newContent = removeDuplicateImports(content + str);
    fs.writeFileSync(`${entryPath.dir}/${entryPath.name}.gen.ts`, newContent);
    return this;
  }

  grantTableReadWrite(table: Table) {
    table.construct.grantReadWriteData(this.construct);
    this.appendToCodeGen(
      generateTableReadFunctions(table.name) +
        generateTableWriteFunctions(table.name),
    );
    return this;
  }
  grantTableRead(table: Table) {
    table.construct.grantReadData(this.construct);
    this.appendToCodeGen(generateTableReadFunctions(table.name));
    return this;
  }
  grantTableWrite(table: Table) {
    table.construct.grantWriteData(this.construct);
    this.appendToCodeGen(generateTableWriteFunctions(table.name));
    return this;
  }

  grantSecretRead(secretNames: string[]) {
    const config = getStackConfig(this.construct);
    this.construct.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: secretNames.map(
          (secretName) =>
            `arn:aws:ssm:${config.awsEnv.region}:${config.awsEnv.account}:parameter/${config.stage}/${secretName}`,
        ),
      }),
    );
    this.appendToCodeGen(generateSecretFunctions(secretNames));
    return this;
  }
}
