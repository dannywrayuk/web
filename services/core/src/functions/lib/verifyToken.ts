import * as jwt from "jsonwebtoken";
import { safe } from "../../lib/safe/safe";

export const verifyToken = safe((token: string, signingKey: string) => {
  const decoded = jwt.verify(token, signingKey);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});
