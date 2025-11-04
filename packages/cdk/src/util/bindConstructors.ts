import { Lambda, LambdaConfig } from "../lambda";
import { Construct } from "constructs";
import { StackReference, StackReferenceConfig } from "../stackReference";
import { Bucket, BucketConfig } from "../bucket";
import { Api, ApiConfig } from "../api";
import { Cdn, CdnConfig } from "../cdn";
import { Table, TableConfig } from "../table";
import { Certificate, CertificateConfig } from "../certificate";

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
