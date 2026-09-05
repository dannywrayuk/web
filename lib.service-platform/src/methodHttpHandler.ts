/* eslint-disable @typescript-eslint/no-explicit-any */

import { methodHandler } from "./methodHandler.ts";

type HttpEvent = {
  headers?: Record<string, string>;
  cookies?: string[];
  queryStringParameters?: Record<string, string>;
  body?: string;
};

type HttpResponse = {
  statusCode?: number;
  headers?: Record<string, string>;
  cookies?: string[];
  body?: string;
};
export const methodHttpHandler =
  <HandlerRequest, HandlerResponse>(
    handler: (event: HandlerRequest, context: any) => Promise<HandlerResponse>,
    secretKeys: readonly string[],
    validateInput: (o: any) => any,
    validateOutput: (o: any) => any,
    marshalInput: null | ((event: HttpEvent) => HandlerRequest),
    unmarshalOutput: null | ((output: HandlerResponse) => HttpResponse),
  ) =>
  async (event: HttpEvent): Promise<HttpResponse> => {
    const marshalledInput =
      marshalInput?.(event) || (event.body as unknown as HandlerRequest);
    const output = await methodHandler(
      handler,
      secretKeys,
      validateInput,
      validateOutput,
    )(marshalledInput);
    const unmarshalledOutput =
      unmarshalOutput?.(output) || ({ body: output } as HttpResponse);
    return unmarshalledOutput;
  };
