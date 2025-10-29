import { ok, error } from "@dannywrayuk/responses";
import { usersTable } from "./meDelete.gen";
import { deleteUser } from "@dannywrayuk/schema/database/users";

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;

  if (sessionLength > 60 * 60) {
    console.log({ message: "Session too old", sessionLength });
    return error();
  }

  const [_, removeUserError] = await deleteUser(usersTable)({
    userId: tokenPayload.sub,
  });

  if (removeUserError) {
    return error();
  }

  return ok("bye");
};
