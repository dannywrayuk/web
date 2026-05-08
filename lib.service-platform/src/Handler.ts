import z from "zod";

export type Handler = {
  name: string;
  serviceName?: string;
  secrets?: readonly string[];
  request?: z.ZodType;
  response?: z.ZodType;
  callers?: string[];
  hasApi?: boolean;
};
