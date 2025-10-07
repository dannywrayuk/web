import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ProfileInfo } from "@/components/ProfileInfo";
import { AiOutlineGithub } from "react-icons/ai";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { loggedIn } = useAuth();
  if (loggedIn) {
    return <ProfileInfo />;
  }
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">Account</h1>
        <p className="mt-8">
          Sign in and manage your account. Or create one if you don't have one
          already.
        </p>
        <div className="flex flex-col mt-8">
          <Link
            to="/login"
            search={{ code: "1234" }}
            className="text-u0 bg-github px-4 py-2 rounded-lg w-full text-center mt-4 inline-block"
          >
            <div className="flex items-center justify-center gap-2">
              <AiOutlineGithub className="size-[1.5em]" />
              <span>GitHub</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
