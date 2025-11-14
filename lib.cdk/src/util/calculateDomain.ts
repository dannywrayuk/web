export const calculateDomain = (config: {
  domainName: string;
  subDomain?: string;
  removeStageSubdomain?: boolean;
  stage: string;
}) => {
  const withStageSubdomain = config.removeStageSubdomain
    ? config.domainName
    : `${config.stage}.${config.domainName}`;

  return config.subDomain
    ? `${config.subDomain}.${withStageSubdomain}`
    : withStageSubdomain;
};
