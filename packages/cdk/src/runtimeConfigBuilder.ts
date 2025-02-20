export const runtimeConfigBuilder = <
  CommonConfig extends Record<string, any>,
  StageConfig,
>(
  commonConfig: CommonConfig,
  stageConfigs: Record<string, StageConfig>,
) => {
  const stageVar = process.env.stage;
  const stageFallback = commonConfig?.defaultStage || "dev";
  if (!stageVar) {
    console.warn(
      `[RuntimeConfigWarn] Stage variable not defined. Defaulting to ${stageFallback}.`,
    );
  }
  const stage = (stageVar || stageFallback) as keyof typeof stageConfigs;
  const stageConfig = stageConfigs[stage];
  if (!stageConfig) {
    throw new Error(
      `[RuntimeConfigError] No config for stage ${String(stage)}.`,
    );
  }
  return {
    common: {
      awsEnv: {
        account: process.env.CDK_DEFAULT_ACCOUNT || "",
        region: process.env.CDK_DEFAULT_REGION || "",
      },
      ...commonConfig,
      stage,
    },
    current: stageConfig,
    stages: Object.keys(stageConfigs) as (keyof typeof stageConfigs)[],
    byStage(stage: keyof typeof stageConfigs) {
      return stageConfigs[stage];
    },
  } as const;
};
