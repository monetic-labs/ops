import { z } from "zod";
import { ISO3166Alpha2Country, CardCompanyType } from "@backpack-fux/pylon-sdk";
import { emailSchema } from "./auth";
import { BridgeUserRole } from "../dtos/bridgeDTO";

export const countryISO3166Alpha2Regex = /^[A-Z]{2}$/;
export const countryISO3166Alpha3Regex = /^[A-Z]{3}$/;

// YYYY-MM-DD month should be 01-12, day should be 01-31
export const birthdayRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
export const phoneRegex = /^[0-9]{9,15}$/;
export const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
export const postcodeRegex = /^[0-9]{5}$/;
export const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/\S*)?$/;
export const companyEINRegex = /^[0-9]{2}-[0-9]{7}$/;
export const ssnRegex = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;

const ssnSchema = z.string().refine(
  (value) => {
    // Accept SSN with or without hyphens
    const ssnRegex = /^(?:\d{3}-?\d{2}-?\d{4})$/;
    return ssnRegex.test(value);
  },
  {
    message: "Invalid SSN format. Please use XXX-XX-XXXX or XXXXXXXXX format.",
  }
);

export const walletAddressSchema = z.object({
  walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").length(42),
});

export const accountAddressSchema = z.object({
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
export const companyAccountSchema = z.object({
    company: z.object({
      name: z.string().min(1).max(255),
      email: emailSchema,
      website: z.string().regex(websiteRegex, "Invalid URL"),
      registeredAddress: accountAddressSchema,
    }),
  });
  
  // Onboard step 2
  export const companyDetailsSchema = z.object({
    walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address"),
    companyEIN: z.string().min(9, "EIN must be at least 9 characters"),
    companyType: z.enum(['sole_proprietorship', 'llc', 'c_corp', 's_corp', 'partnership', 'lp', 'llp', 'nonprofit']),
    companyDescription: z.string().min(1,"Company description is required"),
  });
  
  // Onboard step 3
  export const companyAccountUsersSchema = z.object({
    representatives: z.array(z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      phoneNumber: z.string().regex(phoneRegex, "Invalid phone number"),
      role: z.enum(["owner", "representative", "beneficial-owner"]),
      bridgeUserRole: z.nativeEnum(BridgeUserRole).optional(),
      walletAddress: z.string().regex(walletAddressRegex, "Invalid wallet address").optional(),
    })),
  });
  
  // Onboard step 4
  const userDetailsSchema = z.object({
    countryOfIssue: z.custom<ISO3166Alpha2Country>(),
    birthday: z.string().regex(birthdayRegex, "Invalid birthday format (YYYY-MM-DD)"),
    ssn: ssnSchema,
    registeredAddress: accountAddressSchema,
  });
  
  export const companyUserDetailsSchema = z.object({
    userDetails: z.array(userDetailsSchema).min(1, "At least one owner is required")
  });
  
  // Response data from step 4 presented in step 5
  export const bridgeComplianceSchema = z.object({
    compliance: z
      .object({
        bridgeCustomerId: z.string().uuid(),
        bridgeComplianceId: z.string().uuid(),
      })
      .optional(),
  });
  
  // Onboard step 5
  export const rainComplianceSchema = z.object({
    compliance: z
      .object({
        rainCustomerId: z.string().uuid(),
        rainToSAccepted: z.boolean(),
        rainComplianceId: z.string().uuid(),
      })
      .optional(),
  });

  export type CompanyAccountSchema = z.infer<typeof companyAccountSchema>;
  export type CompanyDetailsSchema = z.infer<typeof companyDetailsSchema>;
  export type CompanyAccountUsersSchema = z.infer<typeof companyAccountUsersSchema>;
  export type CompanyUserDetailsSchema = z.infer<typeof companyUserDetailsSchema>;
  export type BridgeComplianceSchema = z.infer<typeof bridgeComplianceSchema>;
  export type RainComplianceSchema = z.infer<typeof rainComplianceSchema>;
  export type AccountAddressSchema = z.infer<typeof accountAddressSchema>;
  export type WalletAddressSchema = z.infer<typeof walletAddressSchema>;
