import z from "zod";

export type Handler = {
  name: string;
  serviceName?: string;
  method: string;
  secrets?: readonly string[];
  request?: z.ZodType;
  response?: z.ZodType;
  callers?: string[];
};
