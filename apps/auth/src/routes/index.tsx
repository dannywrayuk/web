import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../useAuth";
import { ProfileInfo } from "../ProfileInfo";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { loggedIn } = useAuth();
  if (loggedIn) {
    return <ProfileInfo />;
  }
  return (
    <div>
      <h1>Please log in to see your profile info.</h1>
      <Link to="/login" search={{ code: "1234" }}>
        log in
      </Link>
    </div>
  );
}
