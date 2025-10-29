import { auth } from "@/auth";
import { userMeResponse } from "@dannywrayuk/schema/endpoints/user";

export const userProfileAPI = async () => {
  const rsp = await auth.api.get(`https://api.dev.dannywray.co.uk/user/me`, {
    validateOutput: userMeResponse,
  });
  if (!rsp.ok) {
    return null;
  }
  return rsp.body;
};

export const userDeleteAPI = async () => {
  const rsp = await auth.api.post(
    `https://api.dev.dannywray.co.uk/user/delete`,
  );
  return rsp.ok;
};
