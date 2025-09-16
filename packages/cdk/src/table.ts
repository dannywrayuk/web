import { aws_dynamodb as ddb, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getStackConfig } from "./getStackConfig";
import { exportName } from "./util/exportName";

export type TableConfig = {
  name: string;
  gsi?: {
    name: string;
    PK: string;
    SK?: string;
    projection?: keyof typeof ddb.ProjectionType;
  }[];
} & Partial<ddb.TablePropsV2>;

export class Table {
  public construct: ddb.ITableV2;
  public typeName = "Table";
  public name: string;
  public fullName: string;

  constructor();
  constructor(scope: Construct, tableConfig: TableConfig);
  constructor(scope?: Construct, tableConfig?: TableConfig | null) {
    if (!scope || !tableConfig) {
      return this;
    }
    const stackConfig = getStackConfig(scope);
    const config = { ...stackConfig, ...tableConfig };
    this.name = config.name;
    this.fullName = `${stackConfig.name}-${tableConfig.name}-${stackConfig.stage}`;

    const construct = new ddb.TableV2(scope, `Table-${tableConfig.name}`, {
      ...tableConfig,
      tableName: this.fullName,
      partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
      sortKey: { name: "SK", type: ddb.AttributeType.STRING },
      removalPolicy: config.deletionProtection
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      deletionProtection: config.deletionProtection,
    });

    tableConfig.gsi?.forEach((index) => {
      construct.addGlobalSecondaryIndex({
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
    this.construct = construct;
  }

  export(referenceName?: string) {
    const currentStack = this.construct.stack;
    currentStack.exportValue(this.construct.tableArn, {
      name: exportName({
        stackName: currentStack.stackName,
        referenceName: referenceName || this.name,
        type: this.typeName,
      }),
    });
  }

  from(table: ddb.ITableV2) {
    this.construct = table;
    return this;
  }

  fromArn(
    scope: Construct,
    id: string,
    referenceValue: string,
    referenceName: string,
    fullName: string,
  ) {
    this.name = referenceName;
    this.fullName = fullName;
    return this.from(ddb.TableV2.fromTableArn(scope, id, referenceValue));
  }
}
