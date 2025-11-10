import { aws_certificatemanager as certMan } from "aws-cdk-lib";
import { Config, Certificate, app } from "@dannywrayuk/cdk";

export const config = new Config(
  {
    name: "icebreaker-ui",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {
      certificateArn: (account: string) =>
        `arn:aws:acm:us-east-1:${account}:certificate/a87b0b0a-35c2-497f-b562-c5c7ebb019a7`,
    },
    prod: {
      certificateArn: (account: string) =>
        `arn:aws:acm:us-east-1:${account}:certificate/60cf86ce-0124-486d-8ca4-cb3bee9cfa97`,
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

app(config, ({ Cdn, Bucket, stack }) => {
  const assets = new Bucket({ name: "assets", source: "./dist" });

  //The certificate we need is currently in use, this is ok until we can bring it into this repo
  const certificate = new Certificate().from(
    certMan.Certificate.fromCertificateArn(
      stack,
      "Certificate",
      config.current.certificateArn(config.current.awsEnv.account),
    ),
  );

  new Cdn({
    name: "assets",
    certificate,
    subDomain: "account",
    bucket: assets,
  }).addDomainMapping();
});
