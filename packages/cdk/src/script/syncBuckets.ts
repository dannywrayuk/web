import * as fs from "node:fs";
import { safe } from "./util/safe/safe";
import { execSync } from "node:child_process";

export const syncBuckets = () => {
  const bucketFiles = fs
    .readdirSync("./cdk.out")
    .filter((file) => file.endsWith(".s3.json"));

  bucketFiles.forEach((file) => {
    const { bucketName, source } = JSON.parse(
      fs.readFileSync(`./cdk.out/${file}`, "utf8"),
    );
    console.log(`Syncing ${source} to ${bucketName}`);

    safe(execSync)(`aws s3 sync ${source} s3://${bucketName}`, {
      stdio: "inherit",
    });
  });
};
