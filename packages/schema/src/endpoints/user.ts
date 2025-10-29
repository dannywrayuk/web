import { z } from "zod";

export const userMeResponse = z.object({
  userId: z.string(),
  name: z.string(),
  username: z.string(),
  avatarUrl: z.string(),
  email: z.string(),
  createdAt: z.string(),
});
