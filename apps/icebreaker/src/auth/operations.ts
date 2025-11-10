import { auth } from "@/auth";
import { router } from "@/main";
import { QueryClient } from "@tanstack/react-query";

export const loginMutation = (code: string) => ({
  mutationKey: ["login", "session"],
  mutationFn: async () => {
    await auth.login(code);
    router.navigate({ to: "/" });
  },
});

export const logoutMutation = {
  mutationKey: ["logout", "session"],
  mutationFn: async (_: void, { client }: { client: QueryClient }) => {
    await auth.logout();
    await client.invalidateQueries({ queryKey: ["session"] });
  },
};

export const checkSessionQuery = {
  queryKey: ["session"],
  queryFn: async () => localStorage.getItem("session") === "true",
};
