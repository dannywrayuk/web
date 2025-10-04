import { createContext, useContext } from "react";

type AuthContext = {
  loggedIn: boolean;
  login: (code: string) => Promise<void>;
  refresh: () => Promise<{ value: string } | null>;
  logout: () => Promise<void>;
};

export const authContext = createContext({} as AuthContext);

export const useAuth = () => useContext(authContext);
