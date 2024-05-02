import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

// HACK: map webpack resolution to native ESM
// @ts-expect-error Property '__webpack_require__' does not exist on type 'Window & typeof globalThis'.
window.__webpack_require__ = async (id) => {
  return import(id);
};

// @ts-expect-error `root` might be null
const root = createRoot(document.getElementById("root"));

/**
 * Fetch your server component stream from `/rsc`
 * and render results into the root element as they come in.
 */
createFromFetch(
  fetch("/rsc"),
  // fetch("/rsc").then((x) => {
  //   x.clone().body.pipeTo(
  //     new WritableStream({
  //       write(chunk) {
  //         console.log(new TextDecoder().decode(chunk));
  //       },
  //     }),
  //   );
  //   return x;
  // }),
).then((comp) => {
  root.render(comp);
});
