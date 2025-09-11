import { app, Config } from "@dannywrayuk/cdk";

const config = new Config(
  {
    name: "mock",
    domainName: "dannywray.co.uk",
  },
  {
    dev: {
      removeStageSubdomain: true,
      deletionProtection: true,
    },
  },
);

app(config, ({ Api, Lambda }) => {
  new Api({ name: "main" })
    .createDomainMapping({ subDomain: "mock" })
    .addEndpoints([
      {
        route: "/{mockName+}",
        methods: ["ANY"],
        handler: new Lambda({ name: "responder" }),
      },
    ]);
});
