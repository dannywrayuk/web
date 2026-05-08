import { app, Config } from "@dannywrayuk/cdk";
import type { Handler } from "./Handler.ts";
import * as fs from "node:fs";
import { variableToTypeString } from "@dannywrayuk/cdk/util/variableToTypeString.ts";
import { generateTable } from "@dannywrayuk/cdk/tablegen.ts";
import type { TableData } from "@dannywrayuk/cdk/tablegen.ts";

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
  if (!fs.existsSync("generated")) {
    fs.mkdirSync("generated");
  }
  fs.writeFileSync("generated/config.ts", fileContent);
};

export const buildService = ({
  config,
  handlers,
  tables,
}: {
  config: Config;
  handlers: Record<string, Handler>;
  tables: Record<string, TableData>;
}) =>
  app(config, ({ Lambda }) => {
    generateServiceConfigTypes(config);
    Object.values(tables).forEach((table) => generateTable(table));
    Object.entries(handlers).forEach(([handlerName, handlerConfig]) => {
      if (handlerConfig.callers?.includes("function")) {
        const l = new Lambda({
          name: handlerName,
          runtimeConfig: config,
        });

        if (handlerConfig.secrets) {
          l.grantSecretRead(handlerConfig.secrets as string[]);
        }
      }

      if (handlerConfig.callers?.includes("api")) {
        const lapi = new Lambda({
          name: `${handlerName}-api`,
          runtimeConfig: config,
        });
        lapi.grantSecretRead(handlerConfig.secrets as string[]);
      }
    });
  });
