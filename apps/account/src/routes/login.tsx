import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loading, LoadingMessage } from "@/components/Loading";
import { useQuery } from "@tanstack/react-query";
import { AuthState } from "@/auth/authState";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: (search) => {
    return { code: search.code ? String(search.code) : "" };
  },
});

function RouteComponent() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const { isLoading } = useQuery({
    queryKey: ["login"],
    queryFn: () => new AuthState().login(code),
  });

  if (isLoading)
    return (
      <Loading>
        <LoadingMessage>Logging you in</LoadingMessage>
      </Loading>
    );

  navigate({ to: "/" });
  return (
    <Loading>
      <LoadingMessage>Found you!</LoadingMessage>
    </Loading>
  );
}
