import { index } from "./server/index";
import { rsc } from "./server/rsc";
import { staticAssets } from "./server/staticAssets";
import { buildApp } from "./server/buildApp";

const timeString = (ts: string | number = Date.now()) =>
  new Date(ts).toTimeString().split(" ")[0];

console.log(`\nServer reloaded: ${timeString()}`);
console.log(process.cwd());

let lastRequestTs = Date.now();
Bun.serve({
  async fetch(req) {
    const ts = Date.now();
    if (ts - lastRequestTs > 1000) {
      console.log("");
    }
    lastRequestTs = ts;
    console.log(`${timeString(ts)}: ${req.url}`);

    const url = new URL(req.url);
    if (url.pathname === "/") {
      await buildApp();
      return index(url);
    }
    if (url.pathname === "/rsc") return rsc(url);
    if (url.pathname.startsWith("/static")) return staticAssets(url);
    return new Response("404!");
  },
});
