"use client";
import { useState } from "react";

export const ComponentB = ({ b }: { b: any }) => {
  const [counter, setCount] = useState(0);
  return (
    <>
      <p>I am a client component {b}</p>
      <button
        onClick={() => {
          setCount(counter + 1);
        }}
      >
        {counter}
      </button>
    </>
  );
};
