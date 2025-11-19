import {
  aws_cloudfront as cf,
  aws_cloudfront_origins as cfo,
  aws_route53 as r53,
  aws_route53_targets as r53Targets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { getStackConfig } from "./getStackConfig.ts";
import { calculateDomain } from "./util/calculateDomain.ts";
import { Bucket } from "./bucket.ts";
import { Certificate } from "./certificate.ts";

export type CdnConfig = {
  bucket: Bucket;
  name: string;
  domainName?: string;
  subDomain?: string;
  defaultRootObject?: string;
  errorResponses?: cf.ErrorResponse[];
  certificate?: Certificate;
  addDomainMapping?: boolean;
  removeStageSubdomain?: boolean;
};

export class Cdn {
  public construct: cf.IDistribution;
  public typeName = "CDN";
  public name: string;
  public fullName: string;
  public fullDomain: string;

  constructor();
  constructor(scope: Construct, cdnConfig: CdnConfig);
  constructor(scope?: Construct, cdnConfig?: CdnConfig | null) {
    if (!scope || !cdnConfig) {
      return this;
    }
    const stackConfig = getStackConfig(scope);
    const config = { ...stackConfig, ...cdnConfig };
    this.name = config.name;
    this.fullName = `${stackConfig.name}-${cdnConfig.name}-${stackConfig.stage}`;

    this.fullDomain = calculateDomain(
      config as typeof config & { domainName: string },
    );

    const construct = new cf.Distribution(scope, `Cdn-${cdnConfig.name}`, {
      ...cdnConfig,
      certificate: cdnConfig.certificate?.construct,
      domainNames: this.fullDomain ? [this.fullDomain] : [],
      defaultRootObject: config.defaultRootObject || "index.html",
      errorResponses: cdnConfig.errorResponses || [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin: cfo.S3BucketOrigin.withOriginAccessControl(
          cdnConfig.bucket.construct,
          {
            originAccessLevels: [cf.AccessLevel.READ],
          },
        ),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    this.construct = construct;
  }

  addDomainMapping(domainName?: string) {
    const { domainName: hostedZoneDomain } = getStackConfig(
      this.construct,
    ) as unknown as {
      domainName?: string;
    };

    if (!hostedZoneDomain) {
      throw new Error("Domain is required to add domain mapping to CDN");
    }

    new r53.ARecord(
      this.construct.stack,
      `ARecord-${domainName || this.fullDomain}`,
      {
        zone: r53.HostedZone.fromLookup(
          this.construct.stack,
          `HostedZone-${hostedZoneDomain}`,
          {
            domainName: hostedZoneDomain as string,
          },
        ),
        target: r53.RecordTarget.fromAlias(
          new r53Targets.CloudFrontTarget(this.construct),
        ),
        recordName: domainName || this.fullDomain,
      },
    );
  }

  // This might not be possible with CloudFront distributions
  // Cross this bridge when we come to it

  // export(referenceName?: string) {
  //   const currentStack = this.construct.stack;
  //   currentStack.exportValue(this.construct.distributionId, {
  //     name: exportName({
  //       stackName: currentStack.stackName,
  //       referenceName: referenceName || this.name,
  //       type: this.typeName,
  //     }),
  //   });
  // }

  // from(table: cf.IDistribution) {
  //   this.construct = table;
  //   return this;
  // }

  // fromArn(
  //   scope: Construct,
  //   id: string,
  //   referenceValue: string,
  //   referenceName: string,
  //   fullName: string,
  // ) {
  //   this.name = referenceName;
  //   this.fullName = fullName;
  //   const { domain } = getStackConfig(scope) as unknown as { domain?: string };
  //   if (!domain) {
  //     throw new Error("Domain is required to import CDN by ARN");
  //   }
  //   return this.from(
  //     cf.Distribution.fromDistributionAttributes(scope, id, {
  //       distributionId: referenceValue,
  //       domainName: domain || "",
  //     }),
  //   );
  // }
}
