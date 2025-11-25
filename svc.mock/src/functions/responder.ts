import { fallback, mocks } from "./mocks.ts";

export const handler = async (event: {
  pathParameters?: { mockName?: string };
  requestContext?: { http?: { method?: string } };
}) => {
  const path = event.pathParameters?.mockName;
  const method = event.requestContext?.http?.method;
  console.log({
    path,
    method,
  });

  const mock = mocks[path as keyof typeof mocks];
  if (!mock) {
    return fallback;
  }

  const methodMock = mock[method as keyof typeof mock];
  if (!methodMock) {
    return mock?.ANY || fallback;
  }

  return methodMock;
};
