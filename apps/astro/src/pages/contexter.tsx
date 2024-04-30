import { useContext } from "react";
import { TheContext } from "./TheContext";

export const UsesTheContext = () => {
  const { x } = useContext(TheContext);
  return (
    <div>
      <h2>React using the context</h2>
      <p>{x}</p>
    </div>
  );
};
