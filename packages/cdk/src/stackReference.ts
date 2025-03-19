import {
  Fn,
  Stack,
  aws_apigatewayv2 as apiGw,
  aws_dynamodb as ddb,
  aws_lambda as lambda,
  aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { getStackConfig } from "./getStackConfig";

const exportName = ({
  stackName,
  referenceName,
  type,
}: {
  stackName: string;
  referenceName: string;
  type: string;
}) => {
  return `Stack:${stackName}:Type:${type}:Ref:${referenceName}`;
};

const importId = ({
  fromStack,
  referenceName,
  type,
}: {
  fromStack: string;
  referenceName: string;
  type: string;
}) => {
  return `Imported-${type}-${referenceName}-${fromStack}`;
};

const createResource = <T>(
  stackReference: StackReference,
  type: string,
  referenceName: string,
  builder: (scope: Construct, id: string, referenceValue: string) => T,
): T => {
  const referenceValue = Fn.importValue(
    exportName({
      stackName: stackReference.fromStack,
      referenceName,
      type,
    }),
  );
  return builder(
    stackReference.scope,
    importId({
      fromStack: stackReference.fromStack,
      referenceName,
      type,
    }),
    referenceValue,
  );
};

export class StackReference {
  scope: Construct;
  fromStack: string;
  constructor(
    scope: Construct,
    config: { fromStack: string; fromStage?: string | null },
  ) {
    this.scope = scope;
    if (config.fromStage === null) {
      this.fromStack = config.fromStack;
      return;
    }
    const stage = config.fromStage || getStackConfig(scope).stage;
    this.fromStack = `${config.fromStack}-${stage}`;
  }

  table(referenceName: string) {
    return createResource(
      this,
      "Table",
      referenceName,
      ddb.TableV2.fromTableArn,
    );
  }

  lambda(referenceName: string) {
    return createResource(
      this,
      "Lambda",
      referenceName,
      lambda.Function.fromFunctionArn,
    );
  }

  bucket(referenceName: string) {
    return createResource(
      this,
      "Bucket",
      referenceName,
      s3.Bucket.fromBucketArn,
    );
  }

  api(referenceName: string) {
    return createResource(
      this,
      "Api",
      referenceName,
      (scope: Construct, id: string, referenceValue: string) =>
        apiGw.HttpApi.fromHttpApiAttributes(scope, id, {
          httpApiId: referenceValue,
        }),
    );
  }
}

export class StackExport {
  stack: Stack;
  constructor(stack: Stack) {
    this.stack = stack;
  }

  table(referenceName: string, table: ddb.TableV2) {
    this.stack.exportValue(table.tableArn, {
      name: exportName({
        stackName: this.stack.stackName,
        referenceName,
        type: "Table",
      }),
    });
  }

  lambda(referenceName: string, lambda: lambda.IFunction) {
    this.stack.exportValue(lambda.functionArn, {
      name: exportName({
        stackName: this.stack.stackName,
        referenceName,
        type: "Lambda",
      }),
    });
  }

  api(referenceName: string, api: apiGw.HttpApi) {
    this.stack.exportValue(api.httpApiId, {
      name: exportName({
        stackName: this.stack.stackName,
        referenceName,
        type: "Api",
      }),
    });
  }

  bucket(referenceName: string, bucket: s3.Bucket) {
    this.stack.exportValue(bucket.bucketArn, {
      name: exportName({
        stackName: this.stack.stackName,
        referenceName,
        type: "Bucket",
      }),
    });
  }
}
