import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/delete-account")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">Delete Account</h1>
        <p className="mt-8">
          You are about to delete your account forever. There is no undo button.
        </p>
        <p className="mt-8">Are you sure?</p>
        <div className="flex flex-col">
          <Link
            to="/delete-account-final"
            className="text-u0 bg-red-700 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-red-900"
          >
            Yes, delete my account
          </Link>
          <Link
            to="/"
            className="text-u0 bg-l2 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-l3"
          >
            No, take me back
          </Link>
        </div>
      </div>
    </div>
  );
}
