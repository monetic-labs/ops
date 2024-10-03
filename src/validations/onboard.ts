import { z } from "zod";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

import { emailSchema } from "./auth";

export const phoneRegex = /^[0-9]{9,15}$/;
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
    website: z.string().url(),
    registeredAddress: companyRegisteredAddressSchema,
  }),
});

// Onboard step 2
export const companyDetailsSchema = z.object({
  walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address"),
  companyEIN: z.string().min(9, "EIN must be at least 9 characters"),
  companyType: z.string().min(3,"Company type is required"),
  companyDescription: z.string().min(1,"Company description is required"),
});

// Onboard step 3
export const companyRepresentativeSchema = z.object({
  representatives: z.array(
    z.object({
      name: z.string().min(1).max(255),
      surname: z.string().min(1).max(255),
      email: emailSchema,
      phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format"),
      registeredAddress: companyRegisteredAddressSchema,
    })
  ),
});

export const ownerDetailsSchema = z.object({
  role: z.enum(["bookkeeper", "developer", "admin", "super admin"]),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Invalid SSN format"),
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

// Step 4: Merchant Bridge Create Schema (without website, ssn, and bday)
export const merchantBridgeCreateSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
    registeredAddress: companyRegisteredAddressSchema,
  }),
  representatives: z.array(
    z.object({
      name: z.string().min(1).max(255),
      surname: z.string().min(1).max(255),
      email: emailSchema,
      phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format"),
    })
  ),
  compliance: complianceSchema.shape.compliance.optional(),
});

// Step 5: Merchant Rain Create Schema
export const merchantRainCreateSchema = z.object({
  company: companyInfoSchema.shape.company,
  representatives: companyRepresentativeSchema.shape.representatives,
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

export type CompanyRegisteredAddressSchema = z.infer<typeof companyRegisteredAddressSchema>;
export type CompanyInfoSchema = z.infer<typeof companyInfoSchema>;
export type CompanyDetailsSchema = z.infer<typeof companyDetailsSchema>;
export type CompanyRepresentativeSchema = z.infer<typeof companyRepresentativeSchema>;
export type OwnerDetailsSchema = z.infer<typeof ownerDetailsSchema>;
export type ComplianceSchema = z.infer<typeof complianceSchema>;
export type MerchantBridgeCreateSchema = z.infer<typeof merchantBridgeCreateSchema>;
export type MerchantRainCreateSchema = z.infer<typeof merchantRainCreateSchema>;
export type MerchantDeleteSchema = z.infer<typeof merchantDeleteSchema>;
export type MerchantFeeSchema = z.infer<typeof merchantFeeSchema>;
export type WalletAddressSchema = z.infer<typeof walletAddressSchema>;
