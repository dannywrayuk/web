// src/webapp/App.tsx
import { Suspense } from "react";

// src/webapp/ComponentA.tsx
import { jsxs } from "react/jsx-runtime";
var ComponentA = async ({ a }) => {
  const x = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  return /* @__PURE__ */ jsxs("div", { children: [
    "This is a server component ",
    await x.text()
  ] });
};

// src/webapp/App.tsx
import { ComponentB } from "./ComponentB.js";
import { jsx, jsxs as jsxs2 } from "react/jsx-runtime";
var App = () => {
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsx("h1", { children: "Hello!" }),
    /* @__PURE__ */ jsx(Suspense, { fallback: "crazyyy", children: /* @__PURE__ */ jsx(ComponentA, { a: "test-prop-a" }) }),
    /* @__PURE__ */ jsx(ComponentB, { b: "test-prop-b" })
  ] });
};
var App_default = App;
export {
  App_default as default
};
