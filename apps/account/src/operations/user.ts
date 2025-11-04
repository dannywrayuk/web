import { userProfileAPI, userDeleteAPI } from "@/api/user";

export const userProfileQuery = {
  queryKey: ["userProfile", "session"],
  queryFn: userProfileAPI,
};

export const userDeleteMutation = {
  mutationKey: ["userDelete", "session"],
  mutationFn: userDeleteAPI,
};
