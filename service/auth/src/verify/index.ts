import { getSecrets } from "../lib/getSecrets";

export const handler = async () => {
  const secrets = await getSecrets({ test: "/path/yes" });
  if (secrets) {
    console.log("hello world");
  }
};
