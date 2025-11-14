import { z } from "zod";

export function okResponse<T extends z.ZodType, H extends z.ZodType>(
  bodySchema: T,
  headersSchema?: H,
): z.ZodObject<{
  status: z.ZodLiteral<200>;
  body: T;
}> {
  return z.object({
    status: z.literal(200),
    body: bodySchema,
    headers: headersSchema || z.object({}).optional(),
  });
}

export type OkResponse<T extends z.ZodType, H extends z.ZodType> = z.infer<
  ReturnType<typeof okResponse<T, H>>
>;
