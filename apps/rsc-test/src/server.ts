import express from "express";
import compress from "compression";
import esbuild from "esbuild";
import * as path from "node:path";
// @ts-expect-error doesnt exist
import * as ReactServerDom from "react-server-dom-webpack/server.browser";
import { parse } from "es-module-lexer";
import { createElement } from "react";
import { Readable } from "node:stream";

console.log(`Restarted at: ${new Date().toLocaleString()}`);

const PORT = 4000;
const clientComponentMap: Record<string, any> = {};

const app = express();

app.use(compress());
app.use(express.json());

app.listen(PORT, async () => {
  await buildApp();
  console.log(`listening on ${PORT}...`);
});

const reactComponentRegex = /\.tsx$/;

const rscPlugin = (entryPoints: Set<string>): esbuild.Plugin => {
  return {
    name: "resolve-client-imports",
    setup(build) {
      build.onResolve(
        { filter: reactComponentRegex },
        ({ path: relativePath }) => {
          console.log("hello");
          const fullPath = path.join("src/webapp", relativePath);
          const contents = Bun.file(fullPath).toString();
          console.log("hello", contents);
          if (
            contents.startsWith('"use client"') ||
            contents.startsWith("'use client'")
          ) {
            entryPoints.add(fullPath);
            return {
              external: true,
              path: relativePath.replace(reactComponentRegex, ".js"),
            };
          }
        },
      );
    },
  };
};

const buildApp = async () => {
  const clientEntryPoints = new Set<string>();
  await esbuild.build({
    bundle: true,
    format: "esm",
    logLevel: "error",
    entryPoints: ["./src/webapp/App.jsx"],
    outdir: "./build",
    packages: "external",
    plugins: [rscPlugin(clientEntryPoints)],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });
  /** Build client components */
  const { outputFiles } = await esbuild.build({
    bundle: true,
    format: "esm",
    logLevel: "error",
    entryPoints: ["./src/webapp/_client.jsx", ...clientEntryPoints],
    outdir: "./build/",
    splitting: true,
    write: false,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

  outputFiles.forEach(async (file) => {
    // Parse file export names
    const [, exports] = parse(file.text);
    let newContents = file.text;

    for (const exp of exports) {
      // Create a unique lookup key for each exported component.
      // Could be any identifier!
      // We'll choose the file path + export name for simplicity.
      const key = file.path + exp.n;

      clientComponentMap[key] = {
        // Have the browser import your component from your server
        // at `/build/[component].js`
        id: "/" + path.relative("./build", file.path),
        // Use the detected export name
        name: exp.n,
        // Turn off chunks. This is webpack-specific
        chunks: [],
        // Use an async import for the built resource in the browser
        async: true,
      };

      // Tag each component export with a special `react.client.reference` type
      // and the map key to look up import information.
      // This tells your stream renderer to avoid rendering the
      // client component server-side. Instead, import the built component
      // client-side at `clientComponentMap[key].id`
      newContents += `
${exp.ln}.$$id = ${JSON.stringify(key)};
${exp.ln}.$$typeof = Symbol.for("react.client.reference");
			`;
    }
    await Bun.write(file.path, newContents);
  });
};

app.get("/", async (_: any, res: any) => {
  await buildApp();
  res.set("Content-Type", "text/html");
  res.send(await Bun.file("./public/index.html").text());
});

app.get("/rsc", async (_: any, res: any) => {
  const Page = await import("../build/App.js");
  console.log("a");
  const Comp = createElement(Page.default);
  console.log("b");
  const stream = ReactServerDom.renderToReadableStream(
    Comp,
    clientComponentMap,
  );
  console.log("c");
  Readable.fromWeb(stream).pipe(res);
  console.log("d");
});

app.use(express.static("build"));
