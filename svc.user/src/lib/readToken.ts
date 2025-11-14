import { unsafe } from "@dannywrayuk/results";
import * as jwt from "jsonwebtoken";

export const readToken = unsafe((token: string | undefined) => {
  if (!token) {
    throw new Error("No token provided");
  }
  const decoded = jwt.decode(token);
  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  return decoded;
});
