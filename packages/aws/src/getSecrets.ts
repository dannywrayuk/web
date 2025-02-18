import { GetParametersCommand } from "@aws-sdk/client-ssm";
import { ssmClient } from "./clients/ssm";

type Options = {
  stage: string;
};

export const getSecrets = async <ParameterNames extends Record<string, string>>(
  { stage }: Options,
  parameterNames: ParameterNames,
) => {
  try {
    const reversedParams = Object.entries(parameterNames).reduce(
      (result, [parameterName, parameterPath]) => {
        const path = parameterPath.startsWith("/")
          ? parameterPath
          : `/${stage}/${parameterPath}`;
        result[path] = parameterName;
        return result;
      },
      {} as Record<string, string>,
    );

    const response = await ssmClient.send(
      new GetParametersCommand({
        Names: Object.keys(reversedParams),
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

    return response.Parameters.reduce((result, parameter) => {
      if (!parameter.Name) {
        throw new Error("Param Not found");
      }
      result[reversedParams[parameter.Name] as keyof ParameterNames] =
        parameter.Value as ParameterNames[string];
      return result;
    }, {} as ParameterNames);
  } catch (error) {
    console.error("Error fetching SSM parameter:", error);
    throw error;
  }
};
