import { createFileRoute } from "@tanstack/react-router";
import { Loading, LoadingMessage } from "@/components/Loading";
import { useMutation } from "@tanstack/react-query";
import { loginMutation } from "@/auth/operations";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: (search) => {
    return { code: search.code ? String(search.code) : "" };
  },
});

function RouteComponent() {
  const { code } = Route.useSearch();
  const { mutate: login } = useMutation(loginMutation(code));

  useEffect(() => {
    login();
  }, [login]);

  return (
    <Loading>
      <LoadingMessage>Logging you in</LoadingMessage>
    </Loading>
  );
}
