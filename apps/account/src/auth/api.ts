import { z } from "zod";
import { api } from "@dannywrayuk/api";

const url = import.meta.env.VITE_INTEGRATION_URL;

export const loginAPI = async (code: string) => {
  const { ok, body } = await api.get(`https://auth.${url}/login?code=${code}`, {
    credentials: "include",
    validateOutput: z.object({
      access_token: z.string(),
      expires_in: z.number(),
    }),
  });
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
  };
};

export const refreshAPI = async () => {
  const { ok, body } = await api.get(`https://auth.${url}/refresh`, {
    credentials: "include",
    validateOutput: z.object({
      access_token: z.string(),
      expires_in: z.number(),
    }),
  });
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
  };
};

export const logoutAPI = async () => {
  const { ok } = await api.get(`https://auth.${url}/logout`, {
    credentials: "include",
  });
  return ok;
};
