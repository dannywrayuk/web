import { ok, notFound } from "@dannywrayuk/responses";
import { env, readUsersEntry } from "./me.gen";
import { logger } from "@dannywrayuk/logger";

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.lambda.tokenPayload.sub;
  logger
    .setDebug(env.stage === "dev")
    .attach({
      name: env.functionName,
      service: env.serviceName,
      stage: env.stage,
    })
    .debug("input", {
      userId,
    })
    .info("start");
  const userData = await readUsersEntry({
    PK: `USER_ID#${userId}`,
    SK: "RECORD",
  });

  if (userData?.length !== 1) {
    return notFound();
  }

  const { PK, SK, ...user } = userData[0];

  return ok(user);
};
