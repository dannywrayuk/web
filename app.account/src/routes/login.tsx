import { createFileRoute } from "@tanstack/react-router";
import { Loading, LoadingMessage } from "@/components/Loading";
import { useMutation } from "@tanstack/react-query";
import { loginMutation } from "@/auth/operations";
import { useEffect } from "react";
import { ErrorBubble } from "@/components/ErrorBubble";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: (search) => {
    return { code: search.code ? String(search.code) : "" };
  },
});

function RouteComponent() {
  const { code } = Route.useSearch();
  const { mutate: login, error } = useMutation(loginMutation(code));

  useEffect(() => {
    login();
  }, [login]);
  if (error) {
    return (
      <ErrorBubble message="There was an error logging you in. Please try again." />
    );
  }
  return (
    <Loading>
      <LoadingMessage>Logging you in</LoadingMessage>
    </Loading>
  );
}
