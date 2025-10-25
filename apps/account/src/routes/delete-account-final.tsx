import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/delete-account-final")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { mutateAsync: deleteAccountRequest } = useMutation({
    mutationFn: async () => {
      await fetch(`https://api.dev.dannywray.co.uk/user/me/delete`, {
        method: "GET",
        credentials: "include",
      });
    },
  });
  const deleteAccount = async () => {
    await deleteAccountRequest();
    navigate({ to: "/" });
  };
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">Delete Account</h1>
        <p className="mt-8">
          I'm giving you a second chance, you're welcome. This is your final
          chance to back out.
        </p>
        <p className="mt-8">Are you sure you want to delete your account?</p>
        <div className="flex flex-col">
          <button
            onClick={deleteAccount}
            className="text-u0 bg-red-700 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-red-900"
          >
            Yes, delete my account. I am sure this time.
          </button>
          <Link
            to="/"
            className="text-u0 bg-l2 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-l3"
          >
            No, I'm having second thoughts.
          </Link>
        </div>
      </div>
    </div>
  );
}
