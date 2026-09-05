export const fromHttpCookies = (cookies: string[], cookieNames: string[]) => {
  return cookieNames.reduce(
    (acc, key) => {
      acc[key] = cookies
        .find((cookie) => cookie.startsWith(`${key}=`))
        ?.split("=")[1];
      return acc;
    },
    {} as Record<string, string | undefined>,
  );
};
