import { casing } from "@dannywrayuk/casing";
import { RemovalPolicy, aws_s3 as s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
import crypto from "node:crypto";
import * as fs from "node:fs";
import { getStackConfig } from "./getStackConfig";
import { exportName } from "./util/exportName";

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

export class Bucket {
  public construct: s3.IBucket;
  public typeName = "Bucket";
  public name: string;
  public fullName: string;

  constructor();
  constructor(scope: Construct, bucketConfig: BucketConfig);
  constructor(scope?: Construct, bucketConfig?: BucketConfig | null) {
    if (!scope || !bucketConfig) {
      return this;
    }
    const stackConfig = getStackConfig(scope);
    const config = { ...stackConfig, ...bucketConfig };
    this.name = config.name;
    this.fullName = `${stackConfig.name}-${bucketConfig.name}-${stackConfig.stage}`;

    const namespace = casing.kebab(`${stackConfig.name}-${bucketConfig.name}`);
    const bucketName = createBucketName(`${namespace}-${config.stage}`);

    const construct = new s3.Bucket(scope, `Bucket-${bucketConfig.name}`, {
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

    this.construct = construct;
  }

  export(referenceName?: string) {
    const currentStack = this.construct.stack;
    currentStack.exportValue(this.construct.bucketArn, {
      name: exportName({
        stackName: currentStack.stackName,
        referenceName: referenceName || this.name,
        type: this.typeName,
      }),
    });
  }

  from(bucket: s3.IBucket) {
    this.construct = bucket;
    return this;
  }

  fromArn(
    scope: Construct,
    id: string,
    referenceValue: string,
    referenceName: string,
    fullName: string,
  ) {
    this.name = referenceName;
    this.fullName = fullName;
    return this.from(s3.Bucket.fromBucketArn(scope, id, referenceValue));
  }
}
