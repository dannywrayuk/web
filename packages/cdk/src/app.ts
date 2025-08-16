import { App } from "aws-cdk-lib";
import { Config } from "./config";
import { Stack } from "./stack";
import { bindConstructors } from "./util/bindConstructors";

export const app = (
  config: Config<any, any>,
  appDefinition: (
    constructs: ReturnType<typeof bindConstructors> & { stack: Stack },
  ) => void,
) => {
  const awsApp = new App();
  const stack = new Stack(awsApp, config);
  appDefinition({ stack, ...bindConstructors(stack) });
};
