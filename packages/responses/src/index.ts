export function ok(
  data?: any,
  response?: { headers?: Record<string, string>; cookies?: string[] },
) {
  if (!data)
    return {
      statusCode: 200,
      headers: response?.headers,
      cookies: response?.cookies,
    };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      ...(response?.headers || {}),
    },
    cookies: response?.cookies,
    body: JSON.stringify(data),
  };
}

export function error(message?: string) {
  return {
    statusCode: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message || "There was an error",
    }),
  };
}

export function badRequest(message?: string) {
  return {
    statusCode: 400,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message || "bad request",
    }),
  };
}

export const forbidden = {
  statusCode: 403,
  body: "forbidden",
};
