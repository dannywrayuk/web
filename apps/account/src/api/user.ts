import { auth } from "@/auth";
import { userMeResponse } from "@dannywrayuk/schema/endpoints/user";

const url = import.meta.env.VITE_INTEGRATION_URL;

export const userProfileAPI = async () => {
  const rsp = await auth.api.get(`https://api.${url}/user/me`, {
    validateOutput: userMeResponse,
  });
  if (!rsp.ok) {
    return null;
  }
  return rsp.body;
};

export const userDeleteAPI = async () => {
  const rsp = await auth.api.get(`https://api.${url}/user/me/delete`);
  return rsp.ok;
};
