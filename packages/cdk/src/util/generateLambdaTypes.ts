import { variableToTypeString } from "./variableToTypeString";
import * as fs from "node:fs";
import * as path from "node:path";

export const generateLambdaTypes = ({
  entry,
  stage,
  functionName,
  serviceName,
  runtimeConfig,
  environment,
}: {
  entry: string;
  stage: string;
  functionName: string;
  serviceName: string;
  runtimeConfig: any;
  environment?: Record<string, string>;
}) => {
  let envTypeDef = `${
    runtimeConfig?.stages
      .map((stageName) => {
        return `export type LambdaEnv_${stageName} = ${variableToTypeString(
          runtimeConfig?.byStage(stageName),
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
    runtimeConfig?.stages
      .map((stageName) => `LambdaEnv_${stageName}`)
      .join(" | ") || "{}"
  });`;

  const entryPath = path.parse(entry);
  fs.writeFileSync(`${entryPath.dir}/${entryPath.name}-env.gen.ts`, envTypeDef);
};
