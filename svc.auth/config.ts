import { Config } from "@dannywrayuk/cdk";

export const serviceName = "auth";

export const config = new Config({
  "*": {
    name: serviceName,
    domainName: "dannywray.co.uk",
    authTokenTimeouts: {
      accessToken: 60 * 60 * 6, // 6 hours
      refreshToken: 60 * 60 * 24 * 30, // 30 days
    },
  },
  dev: {
    githubUrl: "https://mock.dannywray.co.uk/github.com",
    githubApiUrl: "https://mock.dannywray.co.uk/api.github.com",
    allowedOrigins: [
      "http://localhost:5173",
      "https://account.dev.dannywray.co.uk",
    ],
  },
  prod: {
    githubUrl: "https://github.com",
    githubApiUrl: "https://api.github.com",
    removeStageSubdomain: true,
    deletionProtection: true,
    allowedOrigins: ["https://account.dannywray.co.uk"],
  },
});
