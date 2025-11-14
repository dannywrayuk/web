import { app, Config } from "@dannywrayuk/cdk";

export const config = new Config(
  {
    name: "core",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {
      allowedOrigins: [
        "http://localhost:5173",
        "https://account.dev.dannywray.co.uk",
      ],
    },
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
      allowedOrigins: ["https://account.dannywray.co.uk"],
    },
  },
);

app(config, ({ Api, Lambda, Table }) => {
  new Api({
    name: "main",
    corsPreflight: {
      allowOrigins: config.current.allowedOrigins,
      allowMethods: ["GET", "POST"],
      allowCredentials: true,
      allowHeaders: ["authorization"],
    },
  })
    .createDomainMapping({ subDomain: "api" })
    .export();

  new Table({
    name: "users",
    gsi: [{ name: "Inverse", PK: "SK", SK: "PK" }],
  }).export();

  new Lambda({ name: "verifyUser" })
    .grantSecretRead(["AUTH_ACCESS_TOKEN_SIGNING_KEY"])
    .export();
});
