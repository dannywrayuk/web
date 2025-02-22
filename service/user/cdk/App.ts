import {
  tableBuilder,
  fsRoutedApiBuilder,
  httpApiBuilder,
} from "@dannywrayuk/cdk";
import { App, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { config, runtimeConfig } from "./config";

class UserStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "UserStack", { env: config.awsEnv });
    const fsRouting = fsRoutedApiBuilder(this, { ...config, runtimeConfig });

    const table = tableBuilder(this, { ...config });

    const userTable = table({
      name: "users",
      gsi: [{ name: "PartitionSortInverse", PK: "SK", SK: "PK" }],
    });
    const api = httpApiBuilder(this, { ...config });

    fsRouting(api({ routes: {} }).api);
  }
}

const app = new App();

new UserStack(app);
