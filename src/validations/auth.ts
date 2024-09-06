import { OTP_CODE_LENGTH } from "@/utils/constants";
import { z } from "zod";

export const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;

export const emailSchema = z.string().regex(emailRegex, "Invalid email address");

export const otpSchema = z.string().length(OTP_CODE_LENGTH, `OTP must be ${OTP_CODE_LENGTH} digits`);
