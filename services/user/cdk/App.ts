import { app, Config } from "@dannywrayuk/cdk";

export const config = new Config(
  {
    name: "user",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

export const runtimeConfig = new Config(
  {},
  {
    dev: {},
    prod: {},
  },
);

app(config, ({ Api, Lambda, Table, StackReference }) => {
  const coreStack = new StackReference({ name: "core" });

  const userTable = coreStack.import(Table, "users");
  const userAuthorizer = coreStack.import(Lambda, "verifyUser").asAuthorizer();
  const coreApi = coreStack.import(Api, "main");

  const endpoints = [
    {
      route: "/user/me",
      methods: ["GET"],
      authorizer: userAuthorizer,
      handler: new Lambda({
        name: "me",
        runtimeConfig,
        environment: {
          userTableName: userTable.construct.tableName,
        },
      }).grantTableReadWrite(userTable),
    },
    {
      route: "/user/me/delete",
      methods: ["GET"],
      authorizer: userAuthorizer,
      handler: new Lambda({
        name: "meDelete",
        runtimeConfig,
        environment: {
          userTableName: userTable.construct.tableName,
        },
      }).grantTableReadWrite(userTable),
    },
  ];

  coreApi.addEndpoints(endpoints);
});
