/* eslint-disable @typescript-eslint/no-explicit-any */
export const methodHandler =
  <HandlerRequest, HandlerResponse>(
    handler: (event: HandlerRequest, context: any) => Promise<HandlerResponse>,
    secretKeys: readonly string[],
    validateInput: (o: any) => any,
    validateOutput: (o: any) => any,
  ) =>
  async (event: HandlerRequest): Promise<HandlerResponse> => {
    const [validatedInput, inputError] = validateInput(event);
    if (inputError) {
      return inputError;
    }
    const output = await handler(validatedInput, {});
    const [validatedOutput, outputError] = validateOutput(output);
    if (outputError) {
      return outputError;
    }
    return validatedOutput;
  };
