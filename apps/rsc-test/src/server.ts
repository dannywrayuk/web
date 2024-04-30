import express from "express";
import compress from "compression";
import esbuild from "esbuild";
import path from "node:path";

console.log(`Restarted at: ${new Date().toLocaleString()}`);

const PORT = 4000;

const app = express();

app.use(compress());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`listening on ${PORT}...`);
});

const reactComponentRegex = /\.tsx$/;

const rscPlugin: esbuild.Plugin = {
  name: "resolve-client-imports",
  setup(build) {
    build.onLoad(
      { filter: reactComponentRegex },
      async ({ path: relativePath }) => {
        const contents = await Bun.file(relativePath).text();
        if (contents.startsWith('"use client"')) {
          const componentName =
            relativePath.match(/.*\/([a-zA-Z]+)\..*/)?.[1] || "Fallback";
          return {
            contents: `export const ${componentName} = (args)=> { 
                            return <div hole-id="${Math.random()}" {...args} />
                       };`,
            loader: "tsx",
          };
        }
      },
    );
  },
};

const buildApp = async () => {
  await esbuild.build({
    bundle: true,
    format: "esm",
    logLevel: "error",
    entryPoints: ["./src/webapp/index.jsx"],
    outdir: "./build",
    jsx: "automatic",
    plugins: [rscPlugin],
  });
};

app.get("/", async (_: any, res: any) => {
  await buildApp();
  res.set("Content-Type", "text/html");
  res.send(await Bun.file("./public/index.html").text());
});

app.use(express.static("build"));
