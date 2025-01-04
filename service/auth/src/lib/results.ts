export function success(data?: any) {
  if (!data)
    return {
      statusCode: 200,
    };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

export function failure() {
  return {
    statusCode: 500,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "There was an error",
    }),
  };
}
