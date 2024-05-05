import * as path from "node:path";
import * as fs from "node:fs";

export const rscPlugin = (clientEntryPoints: Set<string>) => ({
  name: "resolve-client-imports",
  // @ts-ignore
  setup(build) {
    // @ts-ignore
    build.onResolve({ filter: /\.tsx$/ }, ({ path: relativePath }) => {
      const fullPath = relativePath.startsWith("./src/webapp/")
        ? relativePath
        : "./" + path.join("./src/webapp", relativePath);

      console.log({ relativePath, fullPath });

      const contents = fs.readFileSync(fullPath).toString();
      if (
        contents.startsWith('"use client"') ||
        contents.startsWith("'use client'")
      ) {
        clientEntryPoints.add(fullPath);
        return {
          external: true,
          path: relativePath.replace(".tsx", ".js"),
        };
      }
    });
  },
});
