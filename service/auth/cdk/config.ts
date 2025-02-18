import { configBuilder, runtimeConfigBuilder } from "@dannywrayuk/cdk";

export const config = configBuilder(
  {
    name: "auth",
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

export const runtimeConfig = runtimeConfigBuilder(
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
      cookieStages: ["dev"],
    },
    prod: {
      githubUrl: "https://github.com",
      githubApiUrl: "https://api.github.com",
      test: "test",
    },
  },
);
