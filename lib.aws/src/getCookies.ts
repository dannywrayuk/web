export const getCookies = <
  E extends { cookies: string[] },
  C extends readonly string[],
>(
  event: E,
  cookies: C,
): { [K in C[number]]: string | undefined } => {
  const cookiesArray = event.cookies;
  return cookies.reduce(
    (acc, key) => {
      acc[key] = cookiesArray
        .find((cookie) => cookie.startsWith(`${key}=`))
        ?.split("=")[1];
      return acc;
    },
    {} as { [K in C[number]]: string | undefined },
  );
};
