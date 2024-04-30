import { useState } from "react";

export const ReactWithState = () => {
  const [x, set] = useState(0);
  return (
    <div>
      <h2>React With State</h2>
      <button onClick={() => set(x + 1)}>{x}</button>
    </div>
  );
};
