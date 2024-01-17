import { z } from "zod";
import { hash } from "starknet";

export type FieldElement = `0x${string}`;

export const FieldElement = z.string().transform((value, ctx) => {
  const regex = /^0x[0-9a-fA-F]{1,64}$/;

  if (!regex.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `FieldElement must be a hex string with a 0x prefix, got ${value}`,
    });
  }

  const bn = BigInt(value);
  const padded = bn.toString(16).padStart(64, "0");
  return `0x${padded}` as FieldElement;
});

/**
 * Compute the selector from a function or event name.
 *
 * The return value is padded to 32 bytes.
 * @param name the function/event name
 * @returns a field element
 */
export function getSelector(name: string): FieldElement {
  return FieldElement.parse(hash.getSelectorFromName(name));
}
