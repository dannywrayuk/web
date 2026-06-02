import { callable } from "@dannywrayuk/service-platform/callable";
import { z } from "zod";

export const readUserByGithubId = callable("user", {
  name: "readUserByGithubId",
  request: z.object({ githubId: z.string() }),
  response: z
    .object({
      userId: z.string(),
      name: z.string().optional(),
      username: z.string().optional(),
      email: z.string().optional(),
      avatarUrl: z.string().optional(),
      createdAt: z.string().optional(),
    })
    .nullable(),
  callers: ["function"],
});

export const readUserById = callable("user", {
  name: "readUserById",
  request: z.object({ userId: z.string() }),
  response: z
    .object({
      userId: z.string(),
      name: z.string().optional(),
      username: z.string().optional(),
      email: z.string().optional(),
      avatarUrl: z.string().optional(),
      createdAt: z.string().optional(),
      githubId: z.string().optional(),
    })
    .nullable(),
  callers: ["function"],
});

export const createUserByGithubId = callable("user", {
  name: "createUserByGithubId",
  request: z.object({
    name: z.string(),
    username: z.string(),
    email: z.string(),
    avatarUrl: z.string(),
    githubId: z.string(),
  }),
  response: z.object({ userId: z.string() }),
  callers: ["function"],
});
