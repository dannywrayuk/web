import { api } from "./api";

export const login = async (code: string) => {
  const { ok, body } = await api.get(
    `https://auth.dev.dannywray.co.uk/login?code=${code}`,
  );
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token as string,
    expiresIn: body.expires_in as number,
  };
};

export const refresh = async () => {
  const { ok, body } = await api.get(
    `https://auth.dev.dannywray.co.uk/refresh`,
    null,
    {
      credentials: "include",
    },
  );
  if (!ok) {
    return null;
  }
  return {
    accessToken: body.access_token as string,
    expiresIn: body.expires_in as number,
  };
};

export const logout = async () => {
  const { ok } = await api.get(`https://auth.dev.dannywray.co.uk/logout`);
  return ok;
};
