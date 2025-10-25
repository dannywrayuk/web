import { useFetch } from "@/hooks/useFetch";
import { Loading, LoadingMessage } from "./Loading";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { AuthState } from "@/auth/authState";

export const ProfileInfo = () => {
  const { mutate: logout } = useMutation({
    mutationKey: ["logout"],
    mutationFn: async (_, { client }) => {
      await new AuthState().logout();
      await client.invalidateQueries({ queryKey: ["session"] });
    },
  });
  const { data: profile, isLoading } = useFetch(
    ["profile"],
    `https://api.dev.dannywray.co.uk/user/me`,
  );

  if (isLoading)
    return (
      <Loading>
        <LoadingMessage>Loading your account</LoadingMessage>
      </Loading>
    );

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="flex flex-col justify-between bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md min-h-[600px]">
        <h1 className="text-u0 text-4xl font-bold">Account</h1>
        <div className="flex flex-col items-center">
          <img
            src={profile.AVATAR_URL}
            alt="Profile Picture"
            className="w-32 h-32 rounded-full mt-4 mb-4"
          />
          <h2 className="text-lg">{profile.USERNAME}</h2>
          <p className="text-lg">{profile.NAME}</p>
          <p className="text-sm text-u2">{profile.EMAIL}</p>
          <p className="text-sm text-u2">
            Account Created: {new Date(profile.CREATED_AT).toLocaleString()}
          </p>
        </div>
        <div>
          <Link
            to="/delete-account"
            className="text-u0 bg-l2 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-red-900"
          >
            Delete Account
          </Link>
          <button
            className="text-u0 bg-l2 px-4 py-2 rounded-lg w-full text-center mt-4 inline-block hover:bg-red-900"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
