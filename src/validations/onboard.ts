import { z } from "zod";
import { emailSchema } from "./auth";
import { ISO3166Alpha2Country } from "@/types";

const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/;
const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const merchantDeleteSchema = z.object({
  params: z.object({
    merchantId: z.number(),
  }),
});

export const merchantFeeSchema = z.object({
  fee: z.number().min(0).max(100),
});

export const walletAddressSchema = z.object({
  walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").length(42),
});

export const companyRepresentativeSchema = z.object({
  representative: z.object({
    name: z.string().min(1).max(255),
    surname: z.string().min(1).max(255),
    email: emailSchema,
    phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format"),
    walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").length(42),
  }),
});

export const companyInfoSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
    registeredAddress: z.object({
      street1: z.string().max(50),
      street2: z.string().max(50).optional(),
      city: z.string().max(50),
      postcode: z.string().length(5).regex(/^[0-9]{5}$/, "Invalid postal code"),
      state: z.string().length(2).regex(/^[a-zA-Z0-9]{2}$/, "Invalid state code"),
      country: z.string().length(2).regex(/^[a-zA-Z0-9]{2}$/, "Invalid country code"),
    }),
  }),
});

export const complianceSchema = z.object({
  compliance: z.object({
    bridgeCustomerId: z.string().uuid(),
    bridgeComplianceId: z.string().uuid(),
  }).optional(),
});