import { readUserFromGithub } from "../../generated/service.ts";
import { ok, err } from "@dannywrayuk/results";

export default readUserFromGithub(async (event) => {
  const [listResponse, listError] = await usersListBy_githubId(event.githubId);
  if (listError) {
    return err(listError, "retrieving user by github id");
  }
  if (!listResponse) {
    return ok(null);
  }
  if (listResponse.length > 1) {
    return err(null, "multiple users found with github id");
  }

  const userId = listResponse[0].userId;

  const [readResponse, readError] = await usersReadUserRecord(userId);
  if (readError) {
    return err(readError, "reading user record");
  }
  if (!readResponse) {
    return ok(null);
  }
  return ok(readResponse);
});
