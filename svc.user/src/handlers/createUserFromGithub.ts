import {
  createUserFromGithub,
  createUserGithubMap,
  createUserRecord,
  listUserGithubMapByGithubId,
} from "../../generated/service.ts";
import { ok, err } from "@dannywrayuk/results";

export default createUserFromGithub(async (event, ctx) => {
  const [listResponse, listError] = await listUserGithubMapByGithubId(ctx, {
    githubId: event.githubId,
  });

  if (listError) {
    return err(listError, "retrieving user by github id");
  }

  if (listResponse && listResponse.length > 0) {
    return err(null, "user already exists with github id", "user-exists");
  }

  // I guess in the future we might want to check by email

  const userId = `user_${crypto.randomUUID()}`;
  const record = {
    userId,
    name: event.user.name,
    username: event.user.username,
    email: event.user.email,
    avatarUrl: event.user.avatarUrl,
    createdAt: ctx.timestamp,
    githubId: event.githubId,
  };

  const [_, createUserError] = await createUserRecord(ctx, record);

  if (createUserError) {
    return err(createUserError, "creating user record");
  }

  const [__, createLinkError] = await createUserGithubMap(ctx, {
    userId,
    githubId: event.githubId,
  });

  if (createLinkError) {
    return err(createLinkError, "creating github link");
  }

  return ok({ user: record });
});
