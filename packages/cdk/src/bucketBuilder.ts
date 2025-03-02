import { casing } from "@dannywrayuk/casing";
import { RemovalPolicy, Stack, aws_s3 as s3 } from "aws-cdk-lib";
import crypto from "node:crypto";

type ServiceConfig = {
  name: string;
  stage: string;
  deletionProtection?: boolean;
} & Partial<s3.BucketProps>;

type BucketConfig = {
  name: string;
};

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

export const bucketBuilder =
  (stack: Stack, serviceConfig: ServiceConfig) =>
  (bucketConfig: BucketConfig) => {
    const namespace = casing.kebab(
      `${serviceConfig.name}-${bucketConfig.name}`,
    );
    const bucketName = createBucketName(`${namespace}-${serviceConfig.stage}`);

    const bucket = new s3.Bucket(stack, `${namespace}-Bucket-${bucketName}`, {
      bucketName,
      removalPolicy: serviceConfig.deletionProtection
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: serviceConfig.deletionProtection,
      ...serviceConfig,
      ...bucketConfig,
    });

    return bucket;
  };
