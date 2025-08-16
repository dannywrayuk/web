import { casing } from "@dannywrayuk/casing";
import { RemovalPolicy, aws_s3 as s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
import crypto from "node:crypto";
import * as fs from "node:fs";
import { getStackConfig } from "./getStackConfig";

export type BucketConfig = {
  name: string;
  source?: string;
  deletionProtection?: boolean;
} & Partial<s3.BucketProps>;

const deterministicUniqueId = (str: string) => {
  return crypto
    .createHash("md5")
    .update(str + "dannywrayuk")
    .digest("hex")
    .substring(0, 8);
};

const createBucketName = (bucketName: string) => {
  return `${bucketName}-${deterministicUniqueId(bucketName)}`;
};

export class Bucket extends s3.Bucket {
  constructor(scope: Construct, bucketConfig: BucketConfig) {
    const stackConfig = getStackConfig(scope);
    const config = { ...stackConfig, ...bucketConfig };

    const namespace = casing.kebab(`${stackConfig.name}-${bucketConfig.name}`);
    const bucketName = createBucketName(`${namespace}-${config.stage}`);

    super(scope, `Bucket-${bucketConfig.name}`, {
      ...bucketConfig,
      bucketName,
      removalPolicy: config.deletionProtection
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: !config.deletionProtection,
    });

    if (bucketConfig.source) {
      fs.writeFileSync(
        `./cdk.out/${bucketName}.s3.json`,
        JSON.stringify({ bucketName, source: bucketConfig.source }),
      );
    }
  }
}
