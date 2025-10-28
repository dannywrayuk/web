import { z } from "zod";
import { api } from "@dannywrayuk/api";

export const loginAPI = async (code: string) => {
  const { ok, body } = await api.get(
    `https://auth.dev.dannywray.co.uk/login?code=${code}`,
    {
      validateOutput: z.object({
        access_token: z.string(),
        expires_in: z.number(),
      }),
    },
  );
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
  };
};

export const refreshAPI = async () => {
  const { ok, body } = await api.get(
    `https://auth.dev.dannywray.co.uk/refresh`,
    {
      credentials: "include",
      validateOutput: z.object({
        access_token: z.string(),
        expires_in: z.number(),
      }),
    },
  );
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
  };
};

export const logoutAPI = async () => {
  const { ok } = await api.get(`https://auth.dev.dannywray.co.uk/logout`);
  return ok;
};
