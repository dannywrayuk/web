import {
  tableBuilder,
  configBuilder,
  lambdaBuilder,
  grantSecretRead,
  sharedResourcesBuilder,
} from "@dannywrayuk/cdk";
import {
  App,
  Stack,
  aws_dynamodb as ddb,
  aws_lambda as lambda,
} from "aws-cdk-lib";
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

class CoreStack extends Stack {
  externalResources: ExternalResources;

  constructor(scope: Construct) {
    super(scope, "CoreStack", { env: config.awsEnv });
    const table = tableBuilder(this, { ...config });
    const coreStack = sharedResourcesBuilder(this, {
      ...config,
    });
    const lambda = lambdaBuilder(this, {
      ...config,
    });

    const userTable = table({
      name: "users",
      gsi: [{ name: "PartitionSortInverse", PK: "SK", SK: "PK" }],
    });

    coreStack.export.table(userTable, "userTable");

    const verifyUser = lambda({ name: "verifyUser" });
    grantSecretRead(config, [verifyUser], ["AUTH_ACCESS_TOKEN_SIGNING_KEY"]);

    coreStack.export.lambda(verifyUser, "verifyUser");
  }
}

const app = new App();

new CoreStack(app);
