import {
  tableBuilder,
  configBuilder,
  lambdaBuilder,
  grantSecretRead,
} from "@dannywrayuk/cdk";
import { Stack, aws_dynamodb as ddb, aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";

export const config = configBuilder(
  {
    name: "core",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

export type ExternalResources = {
  userTable: ddb.ITableV2;
  verifyUser: lambda.IFunction;
};

export class CoreStack extends Stack {
  externalResources: ExternalResources;

  constructor(scope: Construct) {
    super(scope, "CoreStack", { env: config.awsEnv });
    const table = tableBuilder(this, { ...config });
    const lambda = lambdaBuilder(this, {
      ...config,
      basePath: __dirname + "/..",
    });

    const userTable = table({
      name: "users",
    });

    const verifyUser = lambda({ name: "verifyUser" });
    grantSecretRead(config, [verifyUser], ["AUTH_ACCESS_TOKEN_SIGNING_KEY"]);

    this.externalResources = {
      userTable,
      verifyUser,
    };
  }
}
