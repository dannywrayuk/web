import { ok } from "@dannywrayuk/responses";
import { readUsersEntry } from "./me.gen";

export const handler = async (event: any) => {
  const userId = event.requestContext.authorizer.lambda.tokenPayload.sub;
  const userData = await readUsersEntry({
    PK: `USER_ID#${userId}`,
    SK: "RECORD",
  });

  if (userData?.length !== 1) {
    console.log("user not found");
    return { statusCode: 404, body: "User not found" };
  }

  const { PK, SK, ...user } = userData[0];

  return ok(user, { headers: { "Access-Control-Allow-Origin": "*" } });
};
