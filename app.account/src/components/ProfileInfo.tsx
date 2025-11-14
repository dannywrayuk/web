import { Loading, LoadingMessage } from "./Loading";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logoutMutation } from "@/auth/operations";
import { userProfileQuery } from "@/operations/user";
import { ErrorBubble } from "./ErrorBubble";

export const ProfileInfo = () => {
  const { mutate: logout } = useMutation(logoutMutation);
  const { data: profile, isLoading, error } = useQuery(userProfileQuery);

  if (error)
    return (
      <ErrorBubble message="There was an error loading your profile. Please try again." />
    );

  if (isLoading)
    return (
      <Loading>
        <LoadingMessage>Loading your account</LoadingMessage>
      </Loading>
    );

  if (!profile) return <ErrorBubble message="User not found" />;

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="flex flex-col justify-between bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md min-h-[600px]">
        <h1 className="text-u0 text-4xl font-bold">Account</h1>
        <div className="flex flex-col items-center">
          <img
            src={profile.avatarUrl}
            alt="Profile Picture"
            className="w-32 h-32 rounded-full mt-4 mb-4"
          />
          <h2 className="text-lg">{profile.username}</h2>
          <p className="text-lg">{profile.name}</p>
          <p className="text-sm text-u2">{profile.email}</p>
          <p className="text-sm text-u2">
            Account Created: {new Date(profile.createdAt).toLocaleString()}
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
