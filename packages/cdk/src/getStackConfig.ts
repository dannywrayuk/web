import { Construct } from "constructs";

type StackConfig = {
  name: string;
  stage: string;
  awsEnv: { account: string; region: string };
};

export const getStackConfig = (scope: Construct) => {
  const stackConfig = scope.node.getContext("stackConfig");
  return stackConfig as StackConfig;
};
