import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../useAuth";
import { useEffect } from "react";

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
    if (code && !loggedIn) login(code);
    navigate({ to: "/" });
  }, [code, login, loggedIn, navigate]);

  if (!loggedIn) return <div>Loading...</div>;
  return <div>Redirecting...</div>;
}
