type AwsEnv = { account: string; region: string };

export class Config<
  CommonConfig extends Record<string, unknown> = Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StageConfigs extends Record<any, Record<string, any>> = any,
> {
  private stageConfigs: StageConfigs;
  stageNames: (keyof typeof this.stageConfigs)[];
  common: CommonConfig & {
    awsEnv: AwsEnv;
    stage: keyof StageConfigs;
  };
  current: CommonConfig &
    StageConfigs[keyof StageConfigs] & {
      awsEnv: AwsEnv;
      stage: keyof StageConfigs;
    };
  constructor(commonConfig: CommonConfig, stageConfigs: StageConfigs) {
    this.stageConfigs = stageConfigs;
    const stageVar = process.env.STAGE;
    const stageFallback = commonConfig?.defaultStage || "dev";
    if (!stageVar) {
      console.warn(
        `[ConfigWarn] Stage variable not defined. Defaulting to '${stageFallback}'.`,
      );
    }

    this.stageNames = Object.keys(stageConfigs);

    const stage = (stageVar || stageFallback) as keyof StageConfigs;

    const awsEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT || "",
      region: process.env.CDK_DEFAULT_REGION || "",
    } as AwsEnv;

    this.common = {
      ...commonConfig,
      awsEnv,
      stage,
    } as const;

    const stageConfig = this.fromStage(stage);
    this.current = {
      ...commonConfig,
      ...stageConfig,
      awsEnv,
      stage,
    };
  }

  fromStage(stage: keyof StageConfigs) {
    if (!this.stageNames.includes(stage)) {
      throw new Error(`[ConfigError] No config for '${String(stage)}'.`);
    }
    return this.stageConfigs[stage];
  }
}
