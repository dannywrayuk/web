import { InvokeCommand } from "@aws-sdk/client-lambda";
import { lambdaClient } from "./clients/lambda.ts";
import { err, ok } from "@dannywrayuk/results";

export async function invokeLambda(functionName: string, payload?: unknown) {
  const res = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: payload
        ? Buffer.from(JSON.stringify(payload), "utf8")
        : undefined,
    }),
  );

  if (res.FunctionError) {
    return err(`Error invoking lambda: ${res.FunctionError}`);
  }

  const text = res.Payload
    ? Buffer.from(res.Payload as Uint8Array).toString("utf8")
    : null;
  return ok(text ? JSON.parse(text) : null);
}
