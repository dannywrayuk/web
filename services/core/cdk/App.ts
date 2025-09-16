import { app, Config } from "@dannywrayuk/cdk";

export const config = new Config(
  {
    name: "core",
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

app(config, ({ Api, Lambda, Table }) => {
  new Api({ name: "main" }).createDomainMapping({ subDomain: "api" }).export();

  new Table({
    name: "users",
    gsi: [{ name: "Inverse", PK: "SK", SK: "PK" }],
  }).export();

  new Lambda({ name: "verifyUser" })
    .grantSecretRead(["AUTH_ACCESS_TOKEN_SIGNING_KEY"])
    .export();
});
