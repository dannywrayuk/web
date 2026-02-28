import { z } from "zod";
import { invokeLambda } from "@dannywrayuk/aws/invokeLambda";
import type { AsyncResult } from "@dannywrayuk/results";
import type { Handler } from "./Handler.ts";

export const callable = <T extends Handler>(
  serviceName: string,
  handlerConfig: T,
) => {
  return {
    ...handlerConfig,
    serviceName,
    call: callHandler(serviceName, handlerConfig),
  } as const;
};

type CallHandlerReturn<T extends Handler> = T["request"] extends undefined
  ? T["response"] extends undefined
    ? () => AsyncResult<null>
    : () => AsyncResult<z.infer<T["response"]>>
  : T["response"] extends undefined
    ? (input: z.infer<T["request"]>) => AsyncResult<null>
    : (input: z.infer<T["request"]>) => AsyncResult<z.infer<T["response"]>>;

function callHandler<T extends Handler>(
  serviceName: string,
  handlerConfig: T,
): CallHandlerReturn<T> {
  return (async (input) => {
    const functionName = `${serviceName}-${handlerConfig.name}`;
    console.log(`Calling ${functionName}`);
    return invokeLambda(functionName, input);
  }) as CallHandlerReturn<T>;
}
