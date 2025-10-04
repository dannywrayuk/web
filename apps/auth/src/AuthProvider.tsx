import React, { useEffect } from "react";
import { authContext } from "./useAuth";

type AuthResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = React.useState(
    // We can use this local variable to tell the app there is an active login session
    // that we could try to refresh
    !!localStorage.getItem("session"),
  );

  // Although we want to track these values, we don't want to trigger a re-render when they change
  const refreshTime = React.useRef<number>(0);
  const authResponse = React.useRef<AuthResponse | null>(null);

  const login = async (code: string) => {
    const response = await fetch(
      `https://auth.dev.dannywray.co.uk/login?code=${code}`,
      {
        credentials: "include",
      },
    );
    const data = (await response.json()) as AuthResponse;
    setLoggedIn(true);
    authResponse.current = data;
    refreshTime.current = Date.now() + data.expires_in * 1000;
    localStorage.setItem("session", "true");
  };

  const refresh = async () => {
    if (
      loggedIn &&
      authResponse.current &&
      Date.now() - refreshTime.current > 0
    ) {
      return { value: authResponse.current?.access_token };
    }

    if (!loggedIn) {
      authResponse.current = null;
      return null;
    }

    const response = await fetch("https://auth.dev.dannywray.co.uk/refresh", {
      credentials: "include",
    });

    const data = await response.json();
    setLoggedIn(true);
    authResponse.current = data;
    refreshTime.current = Date.now() + data.expires_in * 1000;
    localStorage.setItem("session", "true");
    return { value: data.access_token };
  };

  const logout = async () => {
    await fetch("https://auth.dev.dannywray.co.uk/logout", {
      credentials: "include",
    });
    setLoggedIn(false);
    authResponse.current = null;
    refreshTime.current = 0;
    localStorage.removeItem("session");
  };

  useEffect(() => {
    if (!localStorage.getItem("session")) return;
    refresh();
  }, []);

  return (
    <authContext.Provider value={{ loggedIn, login, refresh, logout }}>
      {children}
    </authContext.Provider>
  );
};
