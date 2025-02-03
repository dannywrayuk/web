export const getCookies = <
  E extends { cookies: string[] },
  C extends Record<string, string>,
>(
  event: E,
  cookies: C,
) => {
  const cookiesArray = event.cookies;
  return Object.fromEntries(
    Object.entries(cookies).map(([key, value]) => [
      key,
      cookiesArray
        .find((cookie) => cookie.startsWith(`${value}=`))
        ?.split("=")[1],
    ]),
  ) as { [K in keyof C]: string | undefined };
};
