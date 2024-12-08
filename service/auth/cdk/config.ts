import { configBuilder } from "./lib/configBuilder";

export default configBuilder(
  {
    name: "auth",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
    },
  },
);
