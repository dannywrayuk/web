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
  name: string;
  constructor(scope: Construct, config: StackReferenceConfig) {
    this.scope = scope;
    if (config.stage === null) {
      this.name = config.name;
      return;
    }
    const stage = config.stage || getStackConfig(scope).stage;
    this.name = `${config.name}-${stage}`;
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
        ) => InstanceType<T>;
      };
    },
  >(BaseType: T, referenceName: string) {
    const instance = new BaseType();
    const referenceValue = Fn.importValue(
      exportName({
        stackName: this.name,
        referenceName,
        type: instance.typeName,
      }),
    );
    return instance.fromArn(
      this.scope,
      importId({
        fromStack: this.name,
        referenceName,
        type: instance.typeName,
      }),
      referenceValue,
      referenceName,
    );
  }
}
