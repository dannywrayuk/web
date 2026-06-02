
import { serviceFunction } from "@dannywrayuk/service-platform/serviceFunction";
import { createUserByGithubId } from "../../handlers.ts";
import { Env } from "../../generated/config.ts";
import {
  usersListBy_githubId,
  usersCreateUserRecord,
  usersCreateGithubLink,
} from "../../generated/users-table.ts";
import { err, ok } from "@dannywrayuk/results";

export const handler = serviceFunction<Env>()(
  createUserByGithubId,
  async (event, { timestamp }) => {
    const [listResponse, listError] = await usersListBy_githubId(
      event.githubId,
    );
    if (listError) {
      return err(listError, "retrieving user by github id");
    }
    if (listResponse && listResponse.length > 0) {
      return err(null, "user already exists with github id");
    }

    // I guess in the future we might want to check by email

    const userId = `user_${crypto.randomUUID()}`;

    const [_createUserResponse, createUserError] = await usersCreateUserRecord({
      userId,
      name: event.name,
      username: event.username,
      email: event.email,
      avatarUrl: event.avatarUrl,
      createdAt: timestamp,
      githubId: event.githubId,
    });
    if (createUserError) {
      return err(createUserError, "creating user record");
    }

    const [_createLinkResponse, createLinkError] = await usersCreateGithubLink({
      userId,
      githubId: event.githubId,
    });

    if (createLinkError) {
      return err(createLinkError, "creating github link");
    }

    return ok({ userId });
  },
);
