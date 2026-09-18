import {
  readUserFromGithub,
  listUserGithubMapByGithubId,
  readUserRecord,
} from "../../generated/service.ts";
import { ok, err } from "@dannywrayuk/results";

export default readUserFromGithub(async (event, ctx) => {
  const [listResponse, listError] = await listUserGithubMapByGithubId(ctx, {
    githubId: event.githubId,
  });
  if (listError) {
    return err(listError, "retrieving user by github id");
  }
  if (!listResponse) {
    return ok({});
  }
  if (listResponse.length > 1) {
    return err(null, "multiple users found with github id");
  }

  const userId = listResponse[0].userId;

  const [readResponse, readError] = await readUserRecord(ctx, {
    userId,
  });
  if (readError) {
    return err(readError, "reading user record");
  }
  if (!readResponse) {
    // This really is an error state because we have a github link but no user record
    return ok({});
  }
  return ok({ user: readResponse });
});
