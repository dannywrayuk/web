import { configBuilder } from "./lib/configBuilder";

export default configBuilder(
  { name: "auth" },
  {
    dev: {},
    prod: {},
  },
);
