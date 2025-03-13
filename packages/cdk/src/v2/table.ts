import { aws_dynamodb as ddb, RemovalPolicy, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getConfig } from "./getConfig";

type TableConfig = {
  name: string;
  gsi?: {
    name: string;
    PK: string;
    SK?: string;
    projection?: keyof typeof ddb.ProjectionType;
  }[];
} & Partial<ddb.TablePropsV2>;

export class Table extends ddb.TableV2 {
  constructor(scope: Construct, tableConfig: TableConfig) {
    const stackConfig = getConfig(scope);
    const config = { ...stackConfig, ...tableConfig };
    const tableName = `${stackConfig.name}-${tableConfig.name}-${stackConfig.stage}`;

    super(scope, `Table-${tableConfig.name}`, {
      ...tableConfig,
      tableName,
      partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
      sortKey: { name: "SK", type: ddb.AttributeType.STRING },
      removalPolicy: config.deletionProtection
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      deletionProtection: config.deletionProtection,
    });

    tableConfig.gsi?.forEach((index) => {
      this.addGlobalSecondaryIndex({
        indexName: index.name,
        partitionKey: { name: index.PK, type: ddb.AttributeType.STRING },
        sortKey: index.SK
          ? { name: index.SK, type: ddb.AttributeType.STRING }
          : undefined,
        projectionType: index.projection
          ? ddb.ProjectionType[index.projection]
          : ddb.ProjectionType.ALL,
      });
    });
  }
}
