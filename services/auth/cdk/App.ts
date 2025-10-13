import { app, Config } from "@dannywrayuk/cdk";

const config = new Config(
  {
    name: "auth",
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

export const runtimeConfig = new Config(
  {
    authTokenTimeouts: {
      accessToken: 60 * 60 * 6, // 6 hours
      refreshToken: 60 * 60 * 24 * 30, // 30 days
    },
    domainName: "dannywray.co.uk",
  },
  {
    dev: {
      githubUrl: "https://mock.dannywray.co.uk/github.com",
      githubApiUrl: "https://mock.dannywray.co.uk/api.github.com",
    },
    prod: {
      githubUrl: "https://github.com",
      githubApiUrl: "https://api.github.com",
    },
  },
);

app(config, ({ StackReference, Lambda, Api, Table }) => {
  const coreStack = new StackReference({
    name: "core",
  });

  const userTable = coreStack.import(Table, "users");

  new Api({
    name: "main",
    corsPreflight: {
      allowOrigins: config.current.allowedOrigins,
      allowMethods: ["GET"],
      allowCredentials: true,
    },
  })
    .createDomainMapping({ subDomain: "auth" })
    .addEndpoints([
      {
        route: "/token",
        methods: ["POST"],
        handler: new Lambda({
          name: "token",
          timeout: 10,
          runtimeConfig,
        })
          .grantTableReadWrite(userTable)
          .grantSecretRead([
            "GITHUB_CLIENT_ID",
            "GITHUB_CLIENT_SECRET",
            "AUTH_ACCESS_TOKEN_SIGNING_KEY",
            "AUTH_REFRESH_TOKEN_SIGNING_KEY",
          ]),
      },
      {
        route: "/login",
        methods: ["GET"],
        handler: new Lambda({
          name: "login",
          timeout: 10,
          runtimeConfig,
        })
          .grantTableReadWrite(userTable)
          .grantSecretRead([
            "GITHUB_CLIENT_ID",
            "GITHUB_CLIENT_SECRET",
            "AUTH_ACCESS_TOKEN_SIGNING_KEY",
            "AUTH_REFRESH_TOKEN_SIGNING_KEY",
          ]),
      },
      {
        route: "/refresh",
        methods: ["GET"],
        handler: new Lambda({
          name: "refresh",
          timeout: 10,
          runtimeConfig,
        })
          .grantTableReadWrite(userTable)
          .grantSecretRead([
            "GITHUB_CLIENT_ID",
            "GITHUB_CLIENT_SECRET",
            "AUTH_ACCESS_TOKEN_SIGNING_KEY",
            "AUTH_REFRESH_TOKEN_SIGNING_KEY",
          ]),
      },
      {
        route: "/logout",
        methods: ["GET"],
        handler: new Lambda({
          name: "logout",
          timeout: 10,
          runtimeConfig,
        }),
      },
    ]);
});
