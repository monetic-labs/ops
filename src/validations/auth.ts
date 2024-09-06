import { z } from "zod";

export const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;

export const emailSchema = z.string().regex(emailRegex, "Invalid email address");

export const OTP_LENGTH = 6;

export const otpSchema = z.string().length(OTP_LENGTH, "OTP must be 6 digits");
