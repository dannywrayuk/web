import { aws_dynamodb as ddb, RemovalPolicy, Stack } from "aws-cdk-lib";

type ServiceConfig = {
  name: string;
  stage: string;
} & Partial<ddb.TablePropsV2>;

type TableConfig = {
  name: string;
} & Partial<ddb.TablePropsV2>;

export const tableBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) =>
  (tableConfig: TableConfig) => {
    const namespace = `${serviceConfig.name}-${tableConfig.name}`;
    const tableName = `${namespace}-${serviceConfig.stage}`;

    return new ddb.TableV2(stack, `${namespace}-Table-${serviceConfig.stage}`, {
      tableName,
      partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
      sortKey: { name: "SK", type: ddb.AttributeType.STRING },
      removalPolicy: serviceConfig.deletionProtection
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN,
      deletionProtection: serviceConfig.deletionProtection,
      ...serviceConfig,
      ...tableConfig,
    });
  };
