const hourInSeconds = 60 * 60;

export const handler = async (event: any) => {
  const tokenPayload = event.requestContext.authorizer.lambda.tokenPayload;
  const sessionLength = Date.now() / 1000 - tokenPayload.sessionStarted;
  if (sessionLength > hourInSeconds) {
    console.log({ message: "Session too old", sessionLength });
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Session too old",
      }),
    };
  }

  return { statusCode: 200, body: "Hello, World!" };
};
