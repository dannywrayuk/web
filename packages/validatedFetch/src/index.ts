import { err, ok, unsafe } from "@dannywrayuk/results";
import { z } from "zod";

export const validatedFetch = <T extends z.ZodType>(schema: T) => {
  return async (...args: Parameters<typeof fetch>) => {
    const [data, error] = await unsafe(fetch)(...args);
    if (error) {
      return err(error, "fetching data");
    }
    const [json, jsonError] = await unsafe(() => data.json())();
    if (jsonError) {
      return err(jsonError, "parsing json");
    }
    const output = {
      status: data.status,
      headers: data.headers,
      body: json,
    } as const;

    const validatedOutput = schema.safeParse(output);

    if (!validatedOutput.success) {
      return err(validatedOutput.error, "validating schema");
    }
    return ok(validatedOutput.data);
  };
};
