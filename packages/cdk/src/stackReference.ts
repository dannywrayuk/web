import { Fn } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getStackConfig } from "./getStackConfig";
import { exportName } from "./util/exportName";

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

export type StackReferenceConfig = {
  name: string;
  stage?: string | null;
};
export class StackReference {
  scope: Construct;
  stackName: string;
  name: string;
  stage: string;
  constructor(scope: Construct, config: StackReferenceConfig) {
    this.scope = scope;
    if (config.stage === null) {
      this.stackName = config.name;
      return;
    }
    this.name = config.name;
    this.stage = config.stage || getStackConfig(scope).stage;
    this.stackName = `${config.name}-${this.stage}`;
  }

  import<
    T extends {
      new (...args: any[]): {
        typeName: string;
        fromArn: (
          scope: Construct,
          id: string,
          referenceValue: string,
          referenceName: string,
          fullName: string,
        ) => InstanceType<T>;
      };
    },
  >(BaseType: T, referenceName: string) {
    const instance = new BaseType();
    const referenceValue = Fn.importValue(
      exportName({
        stackName: this.stackName,
        referenceName,
        type: instance.typeName,
      }),
    );
    return instance.fromArn(
      this.scope,
      importId({
        fromStack: this.stackName,
        referenceName,
        type: instance.typeName,
      }),
      referenceValue,
      referenceName,
      `${this.name}-${referenceName}-${this.stage}`,
    );
  }
}
