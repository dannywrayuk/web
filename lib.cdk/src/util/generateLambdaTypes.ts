import { Config } from "../config.ts";
import { variableToTypeString } from "./variableToTypeString.ts";

export const generateLambdaTypes = ({
  stage,
  functionName,
  serviceName,
  runtimeConfig,
  environment,
}: {
  stage: string;
  functionName: string;
  serviceName: string;
  runtimeConfig?: Config;
  environment?: Record<string, string>;
}) => {
  return `${
    (runtimeConfig?.stageNames as string[])
      .map((stageName) => {
        return `export type LambdaEnv_${stageName} = ${variableToTypeString(
          runtimeConfig?.fromStage(stageName),
          {
            humanReadable: true,
          },
        )} & { stage: "${stageName}" };`;
      })
      .join("\n\n") || ""
  }

export type CommonEnv = ${variableToTypeString(
    {
      stage,
      functionName,
      serviceName,
      ...(runtimeConfig?.common || {}),
      ...environment,
    },
    {
      humanReadable: true,
    },
  )};

export type LambdaEnv = CommonEnv & (${
    (runtimeConfig?.stageNames as string[])
      .map((stageName: string) => `LambdaEnv_${stageName}`)
      .join(" | ") || "{}"
  });

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;
`;
};
