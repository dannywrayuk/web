import { URL } from "url";

export const index = async (url: URL) => {
  return new Response(Bun.file("./static/index.html"), {
    headers: { "Content-Type": "text/html" },
  });
};
