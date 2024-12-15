import { workflow } from "../lib/engine/framework";

const logger = {
  step: (x) => console.log("logging", JSON.stringify(x, null, 2)),
};
const cond = { step: () => true };

const getSecrets = workflow().step("getSecrets");
const verifyToken = workflow().step("verifyToken").step("refreshToken");
const loggerA = workflow().step("loggerA");
const loggerB = workflow().step("loggerB");
const loggerC = workflow().step("loggerC");
const branchA = workflow().step(loggerA);
const branchB = workflow().step(loggerB);
const branchC = workflow().step(loggerC);

export const verifyWorkflow = workflow()
  .step(getSecrets)
  .step(verifyToken)
  .if(cond)
  .then(branchA)
  .else(branchB)
  .step(branchC)
  .step(logger);
