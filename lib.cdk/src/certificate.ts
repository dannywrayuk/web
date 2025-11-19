import { Construct } from "constructs";
import {
  aws_certificatemanager as certMan,
  aws_route53 as r53,
} from "aws-cdk-lib";
import { exportName } from "./util/exportName.ts";
import { getStackConfig } from "./getStackConfig.ts";

export type CertificateConfig = { name: string; certifiedDomain: string };

export class Certificate {
  public construct: certMan.ICertificate;
  public typeName = "Certificate";
  public name: string;
  public fullName: string;

  constructor();
  constructor(scope: Construct, certConfig: CertificateConfig);
  constructor(scope?: Construct, certConfig?: CertificateConfig) {
    if (!scope || !certConfig) {
      return;
    }

    const stackConfig = getStackConfig(scope) as { domainName?: string };
    this.name = certConfig.name;
    const domainName = stackConfig.domainName;
    if (!domainName) {
      throw new Error(
        `Cannot create Certificate ${certConfig.name} without a domainName in the stack config`,
      );
    }
    const hostedZone = r53.HostedZone.fromLookup(
      scope,
      `HostedZone-Certificate-${certConfig.name}`,
      {
        domainName,
      },
    );

    this.construct = new certMan.Certificate(
      scope,
      `Certificate-${certConfig.name}`,
      {
        domainName: certConfig.certifiedDomain,
        validation: certMan.CertificateValidation.fromDns(hostedZone),
      },
    );
  }

  from(certificate: certMan.ICertificate) {
    this.construct = certificate;
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
    return this.from(
      certMan.Certificate.fromCertificateArn(scope, id, referenceValue),
    );
  }

  export(referenceName?: string) {
    const currentStack = this.construct.stack;
    currentStack.exportValue(this.construct.certificateArn, {
      name: exportName({
        stackName: currentStack.stackName,
        referenceName: referenceName || this.name,
        type: this.typeName,
      }),
    });
  }
}
