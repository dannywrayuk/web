export const configBuilder = <
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
      `[ConfigWarn] Stage variable not defined. Defaulting to ${stageFallback}.`,
    );
  }
  const stage = (stageVar || stageFallback) as keyof typeof stageConfigs;
  const stageConfig = stageConfigs[stage];
  if (!stageConfig) {
    throw new Error(`[ConfigError] No config for stage ${String(stage)}.`);
  }
  return {
    awsEnv: {
      account: process.env.CDK_DEFAULT_ACCOUNT || "",
      region: process.env.CDK_DEFAULT_REGION || "",
    },
    ...commonConfig,
    ...stageConfig,
    stage,
  } as const;
};
