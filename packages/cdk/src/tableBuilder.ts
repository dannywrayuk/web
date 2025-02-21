import { aws_dynamodb as ddb, RemovalPolicy, Stack } from "aws-cdk-lib";

type ServiceConfig = {
  name: string;
  stage: string;
} & Partial<ddb.TablePropsV2>;

type TableConfig = {
  name: string;
  gsi?: {
    name: string;
    PK: string;
    SK?: string;
    projection?: keyof typeof ddb.ProjectionType;
  }[];
} & Partial<ddb.TablePropsV2>;

export const tableBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) =>
  (tableConfig: TableConfig) => {
    const namespace = `${serviceConfig.name}-${tableConfig.name}`;
    const tableName = `${namespace}-${serviceConfig.stage}`;

    const table = new ddb.TableV2(
      stack,
      `${namespace}-Table-${serviceConfig.stage}`,
      {
        tableName,
        partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
        sortKey: { name: "SK", type: ddb.AttributeType.STRING },
        removalPolicy: serviceConfig.deletionProtection
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
        deletionProtection: serviceConfig.deletionProtection,
        ...serviceConfig,
        ...tableConfig,
      },
    );

    tableConfig.gsi?.forEach((index) => {
      table.addGlobalSecondaryIndex({
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

    return table;
  };
