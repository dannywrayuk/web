import { Suspense } from "react";
import { ComponentA } from "./ComponentA.tsx";
import { ComponentB } from "./ComponentB.tsx";

const App = () => {
  return (
    <div>
      <h1>Hello!</h1>
      <Suspense fallback={"crazyyy"}>
        <ComponentA a="test-prop-a" />
      </Suspense>
      <ComponentB b="test-prop-b" />
    </div>
  );
};

export default App;
