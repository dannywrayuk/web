import * as path from "node:path";
import esbuild from "esbuild";
import { parse } from "es-module-lexer";
import * as fs from "node:fs";
import { rscPlugin } from "./rscPlugin";

const buildOutput = "./static/build/";

const buildWithBun = false;

const serverBuildBun = (clientEntryPoints: Set<string>) =>
  Bun.build({
    entrypoints: ["./src/webapp/App.tsx"],
    outdir: buildOutput,
    plugins: [rscPlugin(clientEntryPoints)],
  });

const serverBuildEs = (clientEntryPoints: Set<string>) =>
  esbuild.build({
    bundle: true,
    format: "esm",
    logLevel: "error",
    entryPoints: ["./src/webapp/App.tsx"],
    outdir: "./static/build",
    packages: "external",
    plugins: [rscPlugin(clientEntryPoints)],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

const clientBuildBun = (clientEntryPoints: Set<string>) =>
  Bun.build({
    entrypoints: ["./src/webapp/_client.jsx", ...clientEntryPoints],
    splitting: true,
  }).then((x) => x.outputs);

const clientBuildEs = (clientEntryPoints: Set<string>) =>
  esbuild
    .build({
      bundle: true,
      format: "esm",
      logLevel: "error",
      entryPoints: ["./src/webapp/_client.jsx", ...clientEntryPoints],
      outdir: "./static/build/",
      splitting: true,
      write: false,
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    })
    .then((x) => x.outputFiles);

export const buildApp = async () => {
  // Remove old output
  fs.rmSync(buildOutput, { recursive: true, force: true });
  console.log("\nBuilding App");

  const clientEntryPoints = new Set<string>();
  // Build server component
  if (buildWithBun) {
    await serverBuildBun(clientEntryPoints);
  } else {
    await serverBuildEs(clientEntryPoints);
  }

  console.log({ clientEntryPoints: [...clientEntryPoints] });

  // Build client components
  const outputFiles = buildWithBun
    ? await clientBuildBun(clientEntryPoints)
    : await clientBuildEs(clientEntryPoints);

  const clientComponentMap: Record<string, any> = {};

  for (const file of outputFiles) {
    // Parse file export names
    const content =
      typeof file.text === "string" ? file.text : await file.text();

    const relativePath = "./" + path.relative(buildOutput, file.path);
    const fullPath = buildOutput + relativePath;

    const [, exports] = parse(content);
    const clientSymbols = exports.reduce((acc, exp) => {
      // Create a unique lookup key for each exported component.
      // Could be any identifier!
      // We'll choose the file path + export name for simplicity.
      const key = relativePath + exp.n;

      clientComponentMap[key] = {
        // Have the browser import your component from your server
        // at `/build/[component].js`
        id: relativePath,
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
      return (
        acc +
        "\n" +
        `${exp.ln}.$$id = ${JSON.stringify(key)};\n` +
        `${exp.ln}.$$typeof = Symbol.for("react.client.reference");\n`
      );
    }, "");

    await Bun.write(fullPath, content + clientSymbols);
  }

  await Bun.write(
    "./static/build/clientComponentMap.json",
    JSON.stringify(clientComponentMap),
  );
  console.log("Build App - Done \n");
};
