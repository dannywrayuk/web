export function success(
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

export function failure(message?: string) {
  return {
    statusCode: 500,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message || "There was an error",
    }),
  };
}
