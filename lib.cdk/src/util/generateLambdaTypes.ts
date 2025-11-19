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
  runtimeConfig: any;
  environment?: Record<string, string>;
}) => {
  return `${
    runtimeConfig?.stageNames
      .map((stageName: any) => {
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
    runtimeConfig?.stageNames
      .map((stageName: any) => `LambdaEnv_${stageName}`)
      .join(" | ") || "{}"
  });

export const env = {
    ...process.env,
    ...((process.env.constants || {}) as unknown as object),
  } as unknown as LambdaEnv;
`;
};
