import { readUser, readUserRecord } from "../../generated/service.ts";
import { ok, err } from "@dannywrayuk/results";

export default readUser(async (event, ctx) => {
  const [listResponse, listError] = await readUserRecord(ctx, {
    userId: event.userId,
  });

  if (listError) {
    return err(listError, "retrieving user by id");
  }

  if (!listResponse) {
    return ok({});
  }

  return ok({ user: listResponse });
});
