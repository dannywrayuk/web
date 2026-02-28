import z from "zod";
import type { AsyncResult } from "@dannywrayuk/results";
import { readSecret } from "@dannywrayuk/aws/readSecret";
import { Handler } from "./Handler.ts";
import { logger } from "@dannywrayuk/logger";

const env = {
  ...process.env,
  ...((process.env.constants || {}) as unknown as object),
} as Record<string, string>;

const invocationSource = (event: unknown) => {
  console.log("Event received:", event);
  return null;
};

export const handlerFunction =
  <Env extends { stage: string }>() =>
  <T extends Handler>(
    handlerConfig: T,
    handler: (
      event: z.infer<T["request"]>,
      context: {
        secrets: T["secrets"] extends readonly string[]
          ? Record<T["secrets"][number], string>
          : undefined;
        env: Env & { functionName: string; serviceName: string };
      },
    ) => AsyncResult<z.infer<T["response"]>>,
    maps?: {
      requestMap?: (event: unknown) => z.infer<T["request"]>;
      responseMap?: (res: z.infer<T["response"]>) => Record<string, unknown>;
    },
  ) =>
  async (event: unknown) => {
    logger
      .setDebug(!!env.debugLog)
      .attach({
        name: env.functionName,
        service: env.serviceName,
        stage: env.stage,
      })
      .debug("Event received", { event });

    const source = invocationSource(event);
    logger.debug("Invocation source", { source });
    const mappedEvent = (() => {
      if (source === "apiGateway" && maps?.requestMap) {
        return maps.requestMap(event);
      }
      return event;
    })() as z.infer<T["request"]>;

    const reqCheck = handlerConfig.request?.safeParse(mappedEvent) || {
      data: undefined,
      success: true,
    };
    if (!reqCheck.success) {
      logger.error("Invalid request:", reqCheck.error);
      return (() => {
        if (source === "apiGateway") {
          return {
            statusCode: 400,
            body: JSON.stringify(reqCheck.error),
          };
        }
        return reqCheck.error;
      })();
    }

    const secrets = (
      handlerConfig.secrets
        ? await readSecret({ stage: env.stage as string })(
            handlerConfig.secrets,
          )
        : undefined
    ) as T["secrets"] extends readonly string[]
      ? Record<T["secrets"][number], string>
      : undefined;

    const { name: _, ...slimEnv } = env;
    logger.info("Handler start");
    const [rawResponse, err] = await handler(
      reqCheck.data as z.infer<T["request"]>,
      {
        secrets,
        env: {
          functionName: handlerConfig.name,
          serviceName: handlerConfig.serviceName as string,
          ...(slimEnv as Env),
        },
      },
    );
    logger.info("Handler end");
    if (err) {
      logger.error("Handler error:", err);
      return (() => {
        if (source === "apiGateway") {
          return {
            statusCode: 500,
            body: JSON.stringify(err),
          };
        }
        return err;
      })();
    }
    const mappedResponse = (() => {
      if (source === "apiGateway") {
        return {
          statusCode: 200,
          body: JSON.stringify(rawResponse),
          ...maps?.responseMap?.(rawResponse),
        };
      }
      return rawResponse;
    })();

    return mappedResponse;
  };
