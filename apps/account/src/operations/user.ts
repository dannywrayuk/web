import { userProfileAPI } from "@/api/user";

export const userProfileQuery = {
  queryKey: ["userProfile", "session"],
  queryFn: userProfileAPI,
};
