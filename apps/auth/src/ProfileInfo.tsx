import { useContext } from "react";
import { useFetch } from "./useFetch";
import { authContext } from "./useAuth";

export const ProfileInfo = () => {
  const { logout } = useContext(authContext);
  const {
    data: profile,
    isPending,
    error,
  } = useFetch(["profile"], `https://api.dev.dannywray.co.uk/user/me`);

  if (isPending) return <div>Loading profile...</div>;

  return (
    <div>
      <h1>Profile Info</h1>
      <h2>{profile.NAME}</h2>
      <img src={profile.AVATAR_URL} alt="Profile" />
      <pre>{JSON.stringify({ profile, error }, null, 2)}</pre>
      <button
        onClick={async () => {
          await logout();
        }}
      >
        logout
      </button>
    </div>
  );
};
