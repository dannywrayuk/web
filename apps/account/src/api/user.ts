import { z } from "zod";
import { auth } from "@/auth";

export const userProfileAPI = async () => {
  const rsp = await auth.api.get(`https://api.dev.dannywray.co.uk/user/me`, {
    validateOutput: z.object({
      USER_ID: z.string(),
      NAME: z.string(),
      USERNAME: z.string(),
      AVATAR_URL: z.string(),
      EMAIL: z.string(),
      CREATED_AT: z.string(),
    }),
  });
  if (!rsp.ok) {
    return null;
  }
  return rsp.body;
};
