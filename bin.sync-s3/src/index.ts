#!/usr/bin/env node

import * as fs from "node:fs";
import { unsafe } from "@dannywrayuk/results";
import { execSync } from "node:child_process";

const syncBuckets = () => {
  console.log("Starting sync\n");
  const bucketFiles = fs
    .readdirSync("./cdk.out")
    .filter(
      (file) =>
        file.endsWith(".s3.json") &&
        file.includes(`-${process.env.STAGE || "dev"}-`),
    );

  console.log(`Found ${bucketFiles.length} buckets`);
  bucketFiles
    .map((file) => {
      const content = fs.readFileSync(`./cdk.out/${file}`, "utf8");
      const data = JSON.parse(content);
      console.log(`> ${data.bucketName}`);
      return data;
    })
    .forEach((data) => {
      console.log(`\nSyncing ${data.source} to ${data.bucketName}`);

      const [, syncError] = unsafe(execSync)(
        `aws s3 sync ${data.source} s3://${data.bucketName} --delete`,
        {
          stdio: "inherit",
        },
      );
      if (syncError) {
        console.error("Error syncing\n", syncError.message);
      }
    });
};

syncBuckets();
