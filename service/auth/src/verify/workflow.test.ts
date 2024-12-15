import { expect, test } from "bun:test";
import { engine } from "../lib/engine/framework";
import { verifyWorkflow } from "./workflow";

export const logEngine = (flow: any) => {
  console.log(JSON.stringify(flow, null, 2));
};

test("should work", () => {
  verifyWorkflow.run(logEngine);
  const result = verifyWorkflow.run(engine);
  // expect(result).toBe({});
});
