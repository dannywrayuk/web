import { createElement } from "react";
// @ts-ignore
import * as ReactServerDom from "react-server-dom-webpack/server.browser";
import { URL } from "url";

export const rsc = async (url: URL) => {
  const Page = await import("../../static/build/App.js");
  const clientComponentMap = await Bun.file(
    "./static/build/clientComponentMap.json",
  ).json();
  const Comp = createElement(Page.default);
  const stream = ReactServerDom.renderToReadableStream(
    Comp,
    clientComponentMap,
  );
  return new Response(stream);
};
