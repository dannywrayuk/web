import { handlerFunction } from "@dannywrayuk/service-platform/handlerFunction";
import { createUser } from "../../interface.ts";

export const handler = handlerFunction()(createUser, async (event) => {
  const userId = crypto.randomUUID();

  return { userId };
});
