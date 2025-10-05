import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Loading, LoadingMessage } from "@/components/Loading";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: (search) => {
    return { code: search.code ? String(search.code) : "" };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { code } = Route.useSearch();
  const { login, loggedIn } = useAuth();

  useEffect(() => {
    if (code && !loggedIn) {
      login(code);
      return;
    }
    navigate({ to: "/" });
  }, [code, login, loggedIn, navigate]);

  if (!loggedIn)
    return (
      <Loading>
        <LoadingMessage>Logging you in</LoadingMessage>
      </Loading>
    );
  return (
    <Loading>
      <LoadingMessage>Found you!</LoadingMessage>
    </Loading>
  );
}
