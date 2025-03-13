import { Construct } from "constructs";
import { Fn, aws_dynamodb as ddb } from "aws-cdk-lib";

type ExportNameInput = {
  stackName: string;
  referenceName: string;
  type: string;
};

const exportName = ({ stackName, referenceName, type }: ExportNameInput) => {
  return `Stack:${stackName}:Type:${type}:Ref:${referenceName}`;
};

type ImportIdInput = {
  fromStack: string;
  referenceName: string;
  type: string;
};

const importId = ({ fromStack, referenceName, type }: ImportIdInput) => {
  return `Imported-${type}-${referenceName}-${fromStack}`;
};

export class StackImport {
  scope: Construct;
  fromStack: string;
  constructor(scope: Construct, importConfig: { fromStack: string }) {
    this.scope = scope;
    this.fromStack = importConfig.fromStack;
  }

  table(referenceName: string) {
    const tableArn = Fn.importValue(
      exportName({
        stackName: this.fromStack,
        referenceName,
        type: "Table",
      }),
    );
    return ddb.TableV2.fromTableArn(
      this.scope,
      importId({
        fromStack: this.fromStack,
        referenceName,
        type: "Table",
      }),
      tableArn,
    );
  }
}
