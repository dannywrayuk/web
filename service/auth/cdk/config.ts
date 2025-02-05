import { configBuilder } from "@dannywrayuk/cdk";

export default configBuilder(
  {
    name: "auth",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {
      mockUrl: "mock.dannywray.co.uk/",
    },
    prod: {
      // would like to fix this so it isnt required
      mockUrl: "",
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);
