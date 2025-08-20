export const generateSecretFunctions = (secrets: string[]) => {
  const secretFunctions = `

import { readSecret } from "@dannywrayuk/aws/readSecret";
export const getSecrets = () => readSecret(
    { stage: process.env.stage as string })(
    [${secrets.map((secret) => `"${secret}"`).join(", ")}] as const,
  );
`;
  return secretFunctions;
};
