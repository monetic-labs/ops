import { z } from "zod";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

import { emailSchema } from "./auth";

export const phoneRegex = /^[0-9]{9,15}$/;
export const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
export const postcodeRegex = /^[0-9]{5}$/;
export const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/\S*)?$/;
//export const urlRegexPattern = '^(https?:\\/\\/)?(www\\.)?[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(\\.[a-zA-Z]{2,})?(\\/\\S*)?$';
//export const urlRegex = new RegExp(urlRegexPattern);
export const countryISO3166Alpha2Regex = /^[A-Z]{2}$/;
export const countryISO3166Alpha3Regex = /^[A-Z]{3}$/;
export const companyEINRegex = /^[0-9]{2}-[0-9]{7}$/;
export const ssnRegex = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;

const userRoleSchema = z.enum(["owner", "representative", "beneficial-owner"]);

// YYYY-MM-DD month should be 01-12, day should be 01-31
export const birthdayRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
//export const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;

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

export const rainRegisteredAddressSchema = z.object({
  line1: z.string().max(50),
  line2: z.string().max(50).optional(),
  city: z.string().max(50),
  region: z.string().length(2).regex(/^[a-zA-Z0-9]{2}$/, "Invalid state code"),
  postalCode: z
    .string()
    .length(5)
    .regex(/^[0-9]{5}$/, "Invalid postal code"),
  countryCode: z.custom<ISO3166Alpha2Country>(),
  country: z.string().max(50),
});

// Onboard step 1
export const companyAccountSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
    website: z.string().regex(websiteRegex, "Invalid URL"),
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
  representatives: z.array(z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().regex(phoneRegex, "Invalid phone number"),
    role: z.enum(["owner", "representative", "beneficial-owner"]),
  })),
});

const userSchema = z.object({
  countryOfIssue: z.string().regex(countryISO3166Alpha2Regex, "Invalid country code"),
  birthday: z.string().regex(birthdayRegex, "Invalid birthday format (YYYY-MM-DD)"),
  ssn: z.string().regex(ssnRegex, "Invalid SSN format (123-45-6789)"),
  registeredAddress: companyRegisteredAddressSchema,
});

export const userDetailsSchema = z.object({
  userDetails: z.array(userSchema).min(1, "At least one owner is required")
});

// Response data from step 3
export const bridgeComplianceSchema = z.object({
  compliance: z
    .object({
      bridgeCustomerId: z.string().uuid(),
      bridgeComplianceId: z.string().uuid(),
    })
    .optional(),
});

export const rainComplianceSchema = z.object({
  compliance: z
    .object({
      rainCustomerId: z.string().uuid(),
      rainToSAccepted: z.boolean(),
      rainComplianceId: z.string().uuid(),
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
      firstName: z.string().min(1).max(255),
      lastName: z.string().min(1).max(255),
      email: emailSchema,
      phoneNumber: z.string().regex(phoneRegex, "Invalid phone number format"),
    })
  ),
  compliance: bridgeComplianceSchema.shape.compliance.optional(),
});

// Step 5: Merchant Rain Create Schema
export const merchantRainCreateSchema = z.object({
  initialUser: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    birthDate: z.string().regex(birthdayRegex, "Invalid birthday format"),
    nationalId: z.string().regex(ssnRegex, "Invalid SSN format"),
    countryOfIssue: z.custom<ISO3166Alpha2Country>(),
    address: rainRegisteredAddressSchema,
    role: z.string(),
    iovation: z.string(),
    ipAddress: z.string(),
    isTermsOfServiceAccepted: z.boolean(),
  }),
  address: rainRegisteredAddressSchema,
  name: z.string(),
  entity: z.object({
    name: z.string(),
    website: z.string().regex(websiteRegex, "Invalid URL"),
    type: z.string(),
    description: z.string(),
    taxId: z.string(),
  }),
  representatives: z.array(z.object({
    type: z.literal("representative"),
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    birthDate: z.string().regex(birthdayRegex, "Invalid birthday format"),
    nationalId: z.string().regex(ssnRegex, "Invalid SSN format"),
    countryOfIssue: z.custom<ISO3166Alpha2Country>(),
    address: rainRegisteredAddressSchema,
  })),
  ultimateBeneficialOwners: z.array(z.object({
    type: z.literal("ultimateBeneficialOwner"),
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    birthDate: z.string().regex(birthdayRegex, "Invalid birthday format"),
    nationalId: z.string().regex(ssnRegex, "Invalid SSN format"),
    countryOfIssue: z.custom<ISO3166Alpha2Country>(),
    address: rainRegisteredAddressSchema,
  })),
  chainId: z.string(),
  contractAddress: z.string(),
});

export const merchantDeleteSchema = z.object({
  params: z.object({
    merchantId: z.number(),
  }),
});

export const merchantFeeSchema = z.object({
  fee: z.number().min(0).max(100),
});

export type UserDetailsSchema = z.infer<typeof userDetailsSchema>;
export type CompanyRegisteredAddressSchema = z.infer<typeof companyRegisteredAddressSchema>;
export type CompanyAccountSchema = z.infer<typeof companyAccountSchema>;
export type CompanyDetailsSchema = z.infer<typeof companyDetailsSchema>;
export type CompanyRepresentativeSchema = z.infer<typeof companyRepresentativeSchema>;
export type ComplianceSchema = z.infer<typeof bridgeComplianceSchema>;
export type MerchantBridgeCreateSchema = z.infer<typeof merchantBridgeCreateSchema>;
export type MerchantRainCreateSchema = z.infer<typeof merchantRainCreateSchema>;
export type MerchantDeleteSchema = z.infer<typeof merchantDeleteSchema>;
export type MerchantFeeSchema = z.infer<typeof merchantFeeSchema>;
export type WalletAddressSchema = z.infer<typeof walletAddressSchema>;
