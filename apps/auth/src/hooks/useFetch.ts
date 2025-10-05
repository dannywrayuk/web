import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export const useFetch = (
  queryKey: (string | number | boolean)[],
  ...args: Parameters<typeof fetch>
) => {
  const { refresh } = useAuth();
  return useQuery({
    queryKey,
    queryFn: async () => {
      const token = await refresh();
      if (!token) {
        throw new Error("Not authenticated");
      }
      args[1] = {
        headers: {
          Authorization: `Bearer ${token?.value}`,
          ...(args[1]?.headers || {}),
        },
        ...(args[1] || {}),
      };
      const response = await fetch(...args);
      return await response.json();
    },
  });
};
