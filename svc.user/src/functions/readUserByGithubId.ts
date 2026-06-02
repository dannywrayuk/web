import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { readUserByGithubId } from "../../handlers.ts";
import { Env } from "../../generated/config.ts";
import {
  usersListBy_githubId,
  usersReadUserRecord,
} from "../../generated/users-table.ts";
import { err, ok } from "@dannywrayuk/results";

export const handler = serviceFunction<Env>()(
  readUserByGithubId,
  async (event) => {
    const [listResponse, listError] = await usersListBy_githubId(
      event.githubId,
    );
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
  },
);
