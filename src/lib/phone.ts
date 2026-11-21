import { z } from "zod";

const bdPhoneInputSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .refine((val) => /^(\+8801[3-9]\d{8}|01[3-9]\d{8})$/.test(val), {
    message: "Invalid Bangladesh mobile number. Use 017XXXXXXXX or +88017XXXXXXXX.",
  })
  .transform((val) => (val.startsWith("+88") ? val : `+88${val}`));

/**
 * Normalizes a Bangladesh mobile phone number to `+8801XXXXXXXXX`.
 * Accepts `017XXXXXXXX` or `+88017XXXXXXXX`.
 */
export function normalizeBdPhone(input: string): string {
  return bdPhoneInputSchema.parse(input);
}

/**
 * Formats an integer amount in BDT as `৳500`.
 */
export function formatBdt(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}
