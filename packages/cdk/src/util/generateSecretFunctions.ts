export const generateSecretFunctions = (secrets: string[]) => {
  const secretFunctions = `

import { readSecret } from "@dannywrayuk/aws/readSecret";
console.log(env)
export const getSecrets = () => readSecret(
    { stage: env.stage as string })(
    [${secrets.map((secret) => `"${secret}"`).join(", ")}] as const,
  );
`;
  return secretFunctions;
};
