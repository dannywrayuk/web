export const formatCookie = (
  name: string,
  value: string,
  options?: Record<string, boolean | string | number>,
): string => {
  const cookieString = `${name}=${value}`;
  return cookieString;
};
