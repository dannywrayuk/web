import { configBuilder } from "@dannywrayuk/cdk";
import { Bucket, Cdn, Stack } from "@dannywrayuk/cdk/v2";
import { App, aws_certificatemanager as certMan } from "aws-cdk-lib";
import { Construct } from "constructs";

export const config = configBuilder(
  {
    name: "auth-ui",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {},
    prod: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

class AuthUIStack extends Stack {
  constructor(scope: Construct) {
    super(scope, config);
    const certificate = certMan.Certificate.fromCertificateArn(
      this,
      "Certificate",
      "arn:aws:acm:us-east-1:359810375642:certificate/60cf86ce-0124-486d-8ca4-cb3bee9cfa97",
    );
    const assets = new Bucket(this, { name: "assets", source: "./dist" });

    new Cdn(this, {
      subdomain: "auth",
      bucket: assets,
      certificate,
    });
  }
}

const app = new App();

new AuthUIStack(app);
