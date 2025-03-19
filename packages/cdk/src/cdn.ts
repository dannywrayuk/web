import {
  aws_certificatemanager as certMan,
  aws_cloudfront as cf,
  aws_cloudfront_origins as cfo,
  aws_s3 as s3,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { getStackConfig } from "./getStackConfig";
import { calculateDomain } from "./util/calculateDomain";

type CdnConfig = {
  bucket: s3.IBucket;
  name?: string;
  domainName?: string;
  subdomain?: string;
  certificate?: certMan.ICertificate;
  addDomainMapping?: boolean;
  removeStageSubdomain?: boolean;
};

export class Cdn extends cf.Distribution {
  private config: CdnConfig;
  private fullDomain?: string;

  constructor(scope: Construct, cdnConfig: CdnConfig) {
    const stackConfig = getStackConfig(scope);
    const config = { addDomainMapping: true, ...stackConfig, ...cdnConfig };
    const fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );

    super(scope, `Distribution-${cdnConfig.name || stackConfig.name}`, {
      certificate: cdnConfig.certificate,
      domainNames: fullDomain ? [fullDomain] : [],
      defaultBehavior: {
        origin: cfo.S3BucketOrigin.withOriginAccessControl(cdnConfig.bucket, {
          originAccessLevels: [cf.AccessLevel.READ],
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    this.config = config;
    this.fullDomain = fullDomain;

    if (config.addDomainMapping && fullDomain) {
      this.addDomainMapping();
    }
  }

  addDomainMapping(domainName?: string) {
    new r53.ARecord(this.stack, `ARecord-${domainName || this.fullDomain}`, {
      zone: r53.HostedZone.fromLookup(
        this.stack,
        `HostedZone-${this.config.domainName}`,
        {
          domainName: this.config.domainName as string,
        },
      ),
      target: r53.RecordTarget.fromAlias(new r53Targets.CloudFrontTarget(this)),
      recordName: domainName || this.fullDomain,
    });
  }
}
