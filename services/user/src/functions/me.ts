import { userMeResponse } from "@dannywrayuk/schema/endpoints/user";
import { ok, notFound, error } from "@dannywrayuk/responses";
import { env, usersTable } from "./me.gen";
import { logger } from "@dannywrayuk/logger";
import { z } from "zod";
import { readUserRecord } from "@dannywrayuk/schema/database/users";

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

  const [userData, userDataError] = await readUserRecord(usersTable)({
    userId,
  });

  if (userDataError) {
    logger.error("Error reading user data", { error: userDataError });
    return error();
  }

  if (!userData) {
    return notFound();
  }

  const user: z.Infer<typeof userMeResponse> = {
    userId: userData.USER_ID,
    email: userData.EMAIL,
    username: userData.USERNAME,
    name: userData.NAME,
    avatarUrl: userData.AVATAR_URL,
    createdAt: userData.CREATED_AT,
  };

  return ok(user);
};
