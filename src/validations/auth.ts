import { z } from "zod";

export const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;

export const emailSchema = z.string().regex(emailRegex, "Invalid email address");

export const otpSchema = z.string().length(6, "OTP must be 6 digits");
