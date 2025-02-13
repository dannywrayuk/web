import { configBuilder } from "@dannywrayuk/cdk";

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

export const runtimeConfig = configBuilder(
  {
    authTokenTimeouts: {
      accessToken: 60 * 60 * 6, // 6 hours
      refreshToken: 60 * 60 * 24 * 30, // 30 days
    },
  },
  {
    dev: {
      githubUrl: "https://mock.dannywray.co.uk/github.com",
      githubApiUrl: "https://mock.dannywray.co.uk/api.github.com",
      cookieDomain: undefined,
    },
    prod: {
      githubUrl: "https://github.com",
      githubApiUrl: "https://api.github.com",
      cookieDomain: "dannywray.co.uk",
    },
  },
);
