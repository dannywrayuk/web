import { Lambda, type LambdaConfig } from "../lambda.ts";
import { Construct } from "constructs";
import {
  StackReference,
  type StackReferenceConfig,
} from "../stackReference.ts";
import { Bucket, type BucketConfig } from "../bucket.ts";
import { Api, type ApiConfig } from "../api.ts";
import { Cdn, type CdnConfig } from "../cdn.ts";
import { Table, type TableConfig } from "../table.ts";
import { Certificate, type CertificateConfig } from "../certificate.ts";

export const bindConstructors = (scope: Construct) => ({
  Api: class extends Api {
    constructor(config: ApiConfig) {
      super(scope, config);
    }
  },
  Bucket: class extends Bucket {
    constructor(config: BucketConfig) {
      super(scope, config);
    }
  },
  Certificate: class extends Certificate {
    constructor(config: CertificateConfig) {
      super(scope, config);
    }
  },
  Cdn: class extends Cdn {
    constructor(config: CdnConfig) {
      super(scope, config);
    }
  },
  Lambda: class extends Lambda {
    constructor(config: LambdaConfig) {
      super(scope, config);
    }
  },
  StackReference: class extends StackReference {
    constructor(config: StackReferenceConfig) {
      super(scope, config);
    }
  },
  Table: class extends Table {
    constructor(config: TableConfig) {
      super(scope, config);
    }
  },
});
