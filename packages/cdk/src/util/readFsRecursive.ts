import fs from "node:fs";
import { safe } from "./safe/safe";

const readFs = (path: string) => {
  const current = fs.readdirSync(path);
  return current.reduce((acc, fileOrDir) => {
    if (fs.statSync(`${path}/${fileOrDir}`).isDirectory()) {
      const children = readFs(`${path}/${fileOrDir}`);
      acc.push(...children);
      return acc;
    }
    acc.push(`${path}/${fileOrDir}`);
    return acc;
  }, [] as string[]);
};

export const readFsRecursive = safe(readFs);
