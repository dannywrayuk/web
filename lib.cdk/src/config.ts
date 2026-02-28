type AwsEnv = { account: string; region: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConfigInput = Record<any, Record<string, any>>;

export class Config<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StageConfigs extends ConfigInput = any,
> {
  private stageConfigs: Omit<StageConfigs, "*">;
  stageNames: (keyof typeof this.stageConfigs)[];
  common: ConfigInput["*"] & {
    awsEnv: AwsEnv;
    stage: keyof StageConfigs;
  };
  current: ConfigInput["*"] &
    StageConfigs[keyof StageConfigs] & {
      awsEnv: AwsEnv;
      stage: keyof StageConfigs;
    };
  constructor(config: ConfigInput) {
    const { "*": commonConfig, ...stageConfigs } = config;
    this.stageConfigs = stageConfigs as Omit<StageConfigs, "*">;
    const stageVar = process.env.STAGE;
    const stageFallback = commonConfig?.defaultStage || "dev";
    if (!stageVar) {
      console.warn(
        `[ConfigWarn] Stage variable not defined. Defaulting to '${stageFallback}'.`,
      );
    }

    this.stageNames = Object.keys(stageConfigs) as Exclude<
      keyof StageConfigs,
      "*"
    >[];

    const stage = (stageVar || stageFallback) as Exclude<
      keyof StageConfigs,
      "*"
    >;

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

  fromStage(stage: Exclude<keyof StageConfigs, "*">) {
    if (!this.stageNames.includes(stage)) {
      throw new Error(`[ConfigError] No config for '${String(stage)}'.`);
    }
    return this.stageConfigs[stage];
  }
}
