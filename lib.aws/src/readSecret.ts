import { GetParametersCommand } from "@aws-sdk/client-ssm";
import { ssmClient } from "./clients/ssm.ts";

type Options = {
  stage: string;
};

export const readSecret =
  ({ stage }: Options) =>
  async <ParameterNames extends readonly string[]>(
    parameterNames: ParameterNames,
  ) => {
    try {
      const response = await ssmClient.send(
        new GetParametersCommand({
          Names: parameterNames.map((name) => `/${stage}/${name}`),
          WithDecryption: true,
        }),
      );

      if (
        !response.Parameters?.length ||
        response.InvalidParameters?.length ||
        response.$metadata.httpStatusCode !== 200
      ) {
        throw new Error("Error retrieving secrets");
      }

      return response.Parameters.reduce(
        (acc, param) => {
          acc[param.Name!.split("/").pop() as ParameterNames[number]] =
            param.Value || "";
          return acc;
        },
        {} as Record<ParameterNames[number], string>,
      );
    } catch (error) {
      console.error("Error fetching SSM parameter:", error);
      throw error;
    }
  };
