import { App } from "aws-cdk-lib";
import { Config } from "./config.ts";
import { Stack } from "./stack.ts";
import { bindConstructors } from "./util/bindConstructors.ts";

export const app = (
  config: Config<any, any>,
  appDefinition: (
    constructs: ReturnType<typeof bindConstructors> & { stack: Stack },
  ) => void,
) => {
  const awsApp = new App();
  if (process.env.bundleOff) {
    awsApp.node.setContext("aws:cdk:bundling-stacks", []);
  }
  const stack = new Stack(awsApp, config);
  appDefinition({ stack, ...bindConstructors(stack) });
};
