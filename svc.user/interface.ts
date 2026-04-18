import { callable } from "@dannywrayuk/service-platform/callable";
import { serviceName } from "./config.ts";
import { z } from "zod";

export const readUser = callable(serviceName, {
  name: "readUser",
  method: "GET",
  request: z.object({ userId: z.string() }),
  response: z.object({
    userId: z.string(),
    email: z.string(),
    username: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    createdAt: z.string(),
    githubId: z.string().optional(),
  }),
  callers: ["auth-token"],
} as const);

export const createUser = callable(serviceName, {
  name: "createUser",
  method: "GET",
  request: z.object({
    email: z.string(),
    username: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    createdAt: z.string(),
    githubId: z.string().optional(),
  }),
  response: z.object({ userId: z.string() }),
  callers: ["auth-token"],
} as const);

export const deleteUser = callable(serviceName, {
  name: "deleteUser",
  method: "GET",
  request: z.object({ userId: z.string() }),
  callers: ["auth-token"],
} as const);
