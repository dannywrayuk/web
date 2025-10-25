import { AuthState } from "@/auth/authState";
import { useQuery } from "@tanstack/react-query";

export const useFetch = (
  queryKey: (string | number | boolean)[],
  ...args: Parameters<typeof fetch>
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const token = await new AuthState().getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      args[1] = {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(args[1]?.headers || {}),
        },
        ...(args[1] || {}),
      };
      const response = await fetch(...args);
      return await response.json();
    },
  });
};
