import { otpSchema } from "@/validations/auth";

export const otpConfig = {
  length: otpSchema.length,
  expiry: 10 * 60 * 1000, // 10 minutes
};
