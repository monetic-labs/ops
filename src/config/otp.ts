import { OTP_LENGTH } from "@/validations/auth";

export const otpConfig = {
  length: OTP_LENGTH,
  expiry: 10 * 60 * 1000, // 10 minutes
};