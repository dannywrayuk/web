import z from "zod";
import { err, ok, type AsyncResult } from "@dannywrayuk/results";
import { readSecret } from "@dannywrayuk/aws/readSecret";
import { Handler } from "./Handler.ts";
import { logger } from "@dannywrayuk/logger";

const env = {
  ...process.env,
  ...((process.env.constants || {}) as unknown as object),
} as Record<string, string>;

export const serviceFunction =
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
        timestamp: string;
      },
    ) => AsyncResult<z.infer<T["response"]>>,
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

    const reqCheck = handlerConfig.request?.safeParse(event) || {
      data: undefined,
      success: true,
    };
    if (!reqCheck.success) {
      logger.error("Invalid request:", reqCheck.error);
      return err(reqCheck.error);
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

    const timestamp = new Date().toISOString();
    const [response, handlerError] = await handler(
      reqCheck.data as z.infer<T["request"]>,
      {
        secrets,
        env: {
          functionName: handlerConfig.name,
          serviceName: handlerConfig.serviceName as string,
          ...(slimEnv as Env),
        },
        timestamp,
      },
    );
    logger.info("Handler end");
    if (handlerError) {
      logger.error("Handler error:", handlerError);
      return err(handlerError);
    }

    return ok(response);
  };
