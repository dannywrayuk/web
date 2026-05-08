import { callable } from "@dannywrayuk/service-platform/callable";
import { serviceName } from "./config.ts";
import { z } from "zod";

export const readUserByGithubId = callable(serviceName, {
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

export const createUser = callable(serviceName, {
  name: "createUser",
  request: z.object({
    userId: z.string(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    avatarUrl: z.string(),
    createdAt: z.string(),
    githubId: z.string().optional(),
  }),
  response: z.object({ userId: z.string() }),
  callers: ["function"],
});
