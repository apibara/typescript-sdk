import { z } from "zod";

export type FieldElement = `0x${string}`;

export const FieldElement = z.string().transform((value, ctx) => {
  const regex = /^0x[0-9a-fA-F]{1,64}$/;

  if (!regex.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `FieldElement must be a hex string with a 0x prefix, got ${value}`,
    });
  }

  return value as FieldElement;
});
