export const configBuilder = <CommonConfig, StageConfigs>(
  commonConfig: CommonConfig,
  stageConfigs: StageConfigs,
) => {
  const stageVar = process.env.stage;
  if (!stageVar) {
    console.warn("[ConfigWarn] Stage variable not defined. Defaulting to dev.");
  }
  const stage = (stageVar || "dev") as keyof StageConfigs;
  const stageConfig = stageConfigs[stage];
  if (!stageConfig) {
    throw new Error(`[ConfigError] No config for stage ${stageConfig}.`);
  }
  return { ...commonConfig, ...stageConfig, stage } as const;
};
