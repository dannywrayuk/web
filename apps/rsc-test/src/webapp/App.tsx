import { ComponentA } from "./ComponentA.tsx";
import { ComponentB } from "./ComponentB.tsx";

export const App = () => {
  return (
    <div>
      <h1>Hello!</h1>
      <ComponentA a="test-prop-a" />
      <ComponentB b="test-prop-b" />
    </div>
  );
};
