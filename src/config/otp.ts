import { OTP_CODE_LENGTH } from "@/utils/constants";

export const otpConfig = {
  length: OTP_CODE_LENGTH,
  expiry: 10 * 60 * 1000, // 10 minutes
};
