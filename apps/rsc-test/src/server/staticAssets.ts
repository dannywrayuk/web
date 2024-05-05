import { URL } from "url";
export const staticAssets = (url: URL) => {
  const mimeType =
    { js: "application/javascript", tsx: "application/javascript" }[
      url.pathname.split(".").at(-1) || ""
    ] || "text/html";
  return new Response(Bun.file("." + url.pathname), {
    headers: { "Content-Type": mimeType },
  });
};
