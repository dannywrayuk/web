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

const createResource = <T>(
  stackReference: StackReference,
  type: string,
  referenceName: string,
  builder: (scope: Construct, id: string, referenceValue: string) => T,
): T => {
  const referenceValue = Fn.importValue(
    exportName({
      stackName: stackReference.name,
      referenceName,
      type,
    }),
  );
  return builder(
    stackReference.scope,
    importId({
      fromStack: stackReference.name,
      referenceName,
      type,
    }),
    referenceValue,
  );
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
        ) => InstanceType<T>;
      };
    },
  >(BaseType: T, referenceName: string) {
    const instance = new BaseType();
    return createResource(this, instance.typeName, referenceName, (...args) =>
      instance.fromArn(...args),
    );
  }
}
