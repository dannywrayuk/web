import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { readUserById } from "../../handlers.ts";
import { Env } from "../../generated/config.ts";
import {
  usersListBy_userId,
} from "../../generated/users-table.ts";
import { err, ok } from "@dannywrayuk/results";

export const handler = serviceFunction<Env>()(
  readUserById,
  async (event) => {
    const [listResponse, listError] = await usersListBy_userId(
      event.userId,
    );
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

  }
);
