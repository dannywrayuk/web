import { readUser } from "../../generated/service.ts";
import { ok, err } from "@dannywrayuk/results";

export default readUser(async (event) => {
  const [listResponse, listError] = await usersListBy_userId(event.userId);

  if (listError) {
    return err(listError, "retrieving user by id");
  }

  if (!listResponse) {
    return ok(null);
  }

  if (listResponse.length > 1) {
    return err(null, "multiple users found with id");
  }

  return ok(listResponse[0]);
});
