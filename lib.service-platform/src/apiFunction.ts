import z from "zod";
import { Handler } from "./Handler.ts";
import { AsyncResult, Result } from "@dannywrayuk/results";

export const apiFunction =
  <Env>() =>
  <T extends Handler>(
    handler: T,
    serviceFunctionInstance: (
      event: unknown,
    ) => AsyncResult<z.infer<T["response"]>>,
    apiFunctionOptions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: (event: any) => Result<z.infer<T["request"]>>;
      response: (
        output: z.infer<T["response"]>,
        context: { env: Env },
      ) => Result<unknown>;
      error: (error: Error) => unknown;
    },
  ) => {
    return async (event: unknown) => {
      const [input, inputError] = apiFunctionOptions.request(event);
      if (inputError) {
        return apiFunctionOptions.error(inputError);
      }
      const [output, processingError] = await serviceFunctionInstance(input);
      if (processingError) {
        return apiFunctionOptions.error(processingError);
      }
      const [response, outputError] = apiFunctionOptions.response(output, {
        env: {} as Env,
      });
      if (outputError) {
        return apiFunctionOptions.error(outputError);
      }
      return response;
    };
  };
