import { getSecrets } from "../lib/getSecrets";

export const handler = async () => {
  const secrets = await getSecrets({ test: "yes" });
  if (secrets) {
    console.log(secrets);
  }
  return "Hello!";
};
