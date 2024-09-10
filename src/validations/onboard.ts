import { z } from "zod";
import { emailSchema } from "./auth";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/;
export const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
export const postcodeRegex = /^[0-9]{5}$/;

export const walletAddressSchema = z.object({
  walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").length(42),
});

export const companyRegisteredAddressSchema = z.object({
  street1: z.string().max(50),
  street2: z.string().max(50).optional(),
  city: z.string().max(50),
  postcode: z
    .string()
    .length(5)
    .regex(/^[0-9]{5}$/, "Invalid postal code"),
  state: z
    .string()
    .length(2)
    .regex(/^[a-zA-Z0-9]{2}$/, "Invalid state code"),
  country: z.custom<ISO3166Alpha2Country>(),
});

// Onboard step 1
export const companyInfoSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
    registeredAddress: companyRegisteredAddressSchema,
  }),
  walletAddress: walletAddressSchema.shape.walletAddress,
});

// Onboard step 2
export const companyRepresentativeSchema = z.object({
  representative: z.object({
    name: z.string().min(1).max(255),
    surname: z.string().min(1).max(255),
    email: emailSchema,
    phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format"),
    walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").length(42),
  }),
});

// Response data from step 3
export const complianceSchema = z.object({
  compliance: z
    .object({
      bridgeCustomerId: z.string().uuid(),
      bridgeComplianceId: z.string().uuid(),
    })
    .optional(),
});

// Onboard step 3
export const merchantCreateSchema = z.object({    
  company: companyInfoSchema.shape.company,
  representatives: z.array(companyRepresentativeSchema.shape.representative),
  compliance: complianceSchema.shape.compliance.optional(),
});

export const merchantDeleteSchema = z.object({
  params: z.object({
    merchantId: z.number(),
  }),
});

export const merchantFeeSchema = z.object({
  fee: z.number().min(0).max(100),
});

export type WalletAddressSchema = z.infer<typeof walletAddressSchema>;
export type CompanyRegisteredAddressSchema = z.infer<typeof companyRegisteredAddressSchema>;
export type CompanyInfoSchema = z.infer<typeof companyInfoSchema>;
export type CompanyRepresentativeSchema = z.infer<typeof companyRepresentativeSchema>;
export type ComplianceSchema = z.infer<typeof complianceSchema>;
export type MerchantFormData = z.infer<typeof merchantCreateSchema>;

