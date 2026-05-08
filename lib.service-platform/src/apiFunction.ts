import { AsyncResult } from "@dannywrayuk/results";

// I think having an any here is more simple than trying to type the event accurately
// eslint-disable-next-line
type Event = Record<string, any> | undefined;

export const apiFunction =
  <Env>(
    apiHandler: (
      request: Event,
      context: {
        env: Env;
      },
    ) => AsyncResult<unknown>,
  ) =>
  async (event: unknown) => {
    const [response, error] = await apiHandler(event as Event, {
      env: {} as Env,
    });
    if (error) {
      return {
        statusCode: 500,
      };
    }
    return response;
  };
