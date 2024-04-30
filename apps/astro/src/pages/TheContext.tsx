import { createContext } from "react";

export const TheContext = createContext({ x: "fallbackValue" });

export const TheProvider = ({ children }: any) => {
  console.log(children);
  return (
    <TheContext.Provider value={{ x: "initialValue" }}>
      {children}
    </TheContext.Provider>
  );
};
