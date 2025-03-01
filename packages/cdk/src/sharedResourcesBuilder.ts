import {
  Stack,
  aws_dynamodb as ddb,
  aws_lambda as lambda,
  Fn,
} from "aws-cdk-lib";

export type ServiceConfig = {
  name: string;
  stage: string;
  fromStack?: string;
  fromStage?: string;
};

type ExportNameInput = {
  stackName: string;
  stage: string;
  referenceName: string;
  type: string;
};

const exportName = ({
  stackName,
  stage,
  referenceName,
  type,
}: ExportNameInput) => {
  return `Stage:${stage}:Stack:${stackName}:Type:${type}:Ref:${referenceName}`;
};

type ImportIdInput = {
  serviceName: string;
  fromStack: string;
  referenceName: string;
  fromStage?: string;
  stage: string;
  type: string;
};

const importId = ({
  serviceName,
  fromStack,
  referenceName,
  fromStage,
  stage,
  type,
}: ImportIdInput) => {
  return `${serviceName}-Imported-${fromStack}-${referenceName}-${fromStage || stage}-${type}-${stage}`;
};

export const sharedResourcesBuilder = (stack: Stack, config: ServiceConfig) => {
  const importTable = (referenceName: string) => {
    if (!config.fromStack)
      throw new Error("fromStack is required to import a table");
    const tableArn = Fn.importValue(
      exportName({
        stackName: config.fromStack,
        stage: config.fromStage || config.stage,
        referenceName,
        type: "Table",
      }),
    );
    return ddb.TableV2.fromTableArn(
      stack,
      importId({
        serviceName: config.name,
        fromStack: config.fromStack,
        referenceName,
        fromStage: config.fromStage || config.stage,
        stage: config.stage,
        type: "Table",
      }),
      tableArn,
    );
  };

  const exportTable = (table: ddb.ITableV2, referenceName: string) => {
    stack.exportValue(table.tableArn, {
      name: exportName({
        stackName: stack.stackName,
        stage: config.stage,
        referenceName,
        type: "Table",
      }),
    });
  };

  const importLambda = (referenceName: string) => {
    if (!config.fromStack)
      throw new Error("fromStack is required to import a lambda");

    const lambdaArn = Fn.importValue(
      exportName({
        stackName: config.fromStack,
        stage: config.fromStage || config.stage,
        referenceName,
        type: "Lambda",
      }),
    );
    return lambda.Function.fromFunctionArn(
      stack,
      importId({
        serviceName: config.name,
        fromStack: config.fromStack,
        referenceName,
        fromStage: config.fromStage || config.stage,
        stage: config.stage,
        type: "Lambda",
      }),
      lambdaArn,
    );
  };

  const exportLambda = (lambda: lambda.IFunction, referenceName: string) => {
    stack.exportValue(lambda.functionArn, {
      name: exportName({
        stackName: stack.stackName,
        stage: config.stage,
        referenceName,
        type: "Lambda",
      }),
    });
  };

  return {
    import: { table: importTable, lambda: importLambda },
    export: { table: exportTable, lambda: exportLambda },
  };
};
