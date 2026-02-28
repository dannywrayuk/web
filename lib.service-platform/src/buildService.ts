import { app, Config } from "@dannywrayuk/cdk";
import type { Handler } from "./Handler.ts";
import * as fs from "node:fs";
import { variableToTypeString } from "@dannywrayuk/cdk/util/variableToTypeString.ts";

const generateServiceConfigTypes = (config: Config) => {
  const configTypes = `${
    (config?.stageNames as string[])
      .map((stageName) => {
        return `export type Env_${stageName} = ${variableToTypeString(
          config?.fromStage(stageName),
          {
            humanReadable: true,
          },
        )} & { stage: "${stageName}" };`;
      })
      .join("\n\n") || ""
  }

export type CommonEnv = ${variableToTypeString(config?.common || {}, {
    humanReadable: true,
  })};

export type Env = CommonEnv & (${
    (config?.stageNames as string[])
      .map((stageName: string) => `Env_${stageName}`)
      .join(" | ") || "{}"
  });
`;

  const fileContent = `// This file is auto-generated. Do not edit.\n\n${configTypes}`;
  fs.writeFileSync("config.generated.ts", fileContent);
};

export const buildService = ({
  config,
  handlers,
}: {
  config: Config;
  handlers: Record<string, Handler>;
}) =>
  app(config, ({ Lambda }) => {
    generateServiceConfigTypes(config);
    Object.entries(handlers).forEach(([handlerName, handlerConfig]) => {
      const l = new Lambda({
        name: handlerName,
        runtimeConfig: config,
      });

      if (handlerConfig.secrets) {
        l.grantSecretRead(handlerConfig.secrets as string[]);
      }
    });
  });
