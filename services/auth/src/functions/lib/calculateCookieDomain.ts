export const calculateCookieDomain = (
  currentStage: string,
  requestedStage: string,
  allowedStages: string[] | undefined,
  domain: string,
) => {
  if (currentStage === "prod") {
    return domain;
  } else {
    if (allowedStages?.includes(requestedStage)) {
      return `${requestedStage}.${domain}`;
    }
    return `${currentStage}.${domain}`;
  }
};
