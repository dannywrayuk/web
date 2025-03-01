import * as jwt from "jsonwebtoken";
import { safe } from "./safe/safe";

export const readToken = safe((token: string | undefined) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const decoded = jwt.decode(token);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});
