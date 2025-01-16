import { z } from "zod";
import { isAddress } from "viem";
import postcodeMap from "@/data/postcodes-map.json";

// Add validation patterns
const birthdayRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const phoneRegex = /^[0-9]{9,15}$/;
const ssnRegex = /^(?:\d{3}-?\d{2}-?\d{4})$/;
const postcodeRegex = /^[0-9]{5}$/;

// Define company types enum
export const CardCompanyType = {
  SOLE_PROPRIETORSHIP: "sole_proprietorship",
  LLC: "llc",
  C_CORP: "c_corp",
  S_CORP: "s_corp",
  PARTNERSHIP: "partnership",
  LP: "lp",
  LLP: "llp",
  NONPROFIT: "nonprofit",
} as const;

// Update the role enum
export const UserRole = {
  BENEFICIAL_OWNER: "beneficial_owner",
  REPRESENTATIVE: "representative",
} as const;

export const companyDetailsSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name is too long"),
  companyEmail: z.string().email("Please enter a valid email address"),
  companyWebsite: z
    .string()
    .transform((val) => {
      let url = val.trim().toLowerCase();
      url = url.replace(/^https?:\/\//, "");
      url = url.replace(/^www\./, "");
      return url;
    })
    .pipe(
      z
        .string()
        .min(1, "Website is required")
        .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/, "Please enter a valid domain")
    )
    .optional(),
  postcode: z
    .string()
    .regex(postcodeRegex, "Please enter a valid postal code")
    .refine((val) => postcodeMap[val] !== undefined, "Postcode not found"),
  city: z.string().min(2, "City name is too short"),
  state: z.string().length(2, "Please use 2-letter state code"),
  streetAddress1: z.string().min(5, "Please enter a valid street address"),
  streetAddress2: z.string().optional(),
});

export const companyAccountSchema = z.object({
  settlementAddress: z
    .string()
    .min(42, "Settlement address must be 42 characters")
    .max(42, "Settlement address must be 42 characters")
    .refine((val) => isAddress(val), "Please enter a valid hex address"),
  companyRegistrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .max(12, "Registration number cannot exceed 12 characters")
    .regex(/^\d+$/, "Please enter a valid registration number"),
  companyTaxId: z.string().regex(/^\d{2}-\d{7}$/, "Please enter a valid Tax ID (XX-XXXXXXX)"),
  companyType: z.enum(
    [
      CardCompanyType.SOLE_PROPRIETORSHIP,
      CardCompanyType.LLC,
      CardCompanyType.C_CORP,
      CardCompanyType.S_CORP,
      CardCompanyType.PARTNERSHIP,
      CardCompanyType.LP,
      CardCompanyType.LLP,
      CardCompanyType.NONPROFIT,
    ],
    {
      errorMap: () => ({ message: "Please select a valid company type" }),
    }
  ),
  companyDescription: z.string().max(100, "Description cannot exceed 100 characters").optional(),
});

export const userDetailsSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Please enter a valid email").max(50, "Email cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number can only contain digits")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits"),
  roles: z
    .array(z.enum([UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE]))
    .min(1, "At least one role must be selected"),
  countryOfIssue: z.string().min(1, "Country is required"),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .regex(birthdayRegex, "Birth date must be in YYYY-MM-DD format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18;
    }, "Must be at least 18 years old"),
  socialSecurityNumber: z
    .string()
    .min(1, "SSN is required")
    .regex(ssnRegex, "Please enter a valid SSN (XXX-XX-XXXX)")
    .transform((val) => val.replace(/\D/g, "")),
  streetAddress1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address cannot exceed 100 characters"),
  streetAddress2: z.string().max(100, "Street address cannot exceed 100 characters").optional(),
  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "City can only contain letters, spaces, hyphens, and apostrophes"),
  state: z
    .string()
    .min(1, "State is required")
    .length(2, "Please use 2-letter state code")
    .regex(/^[A-Z]+$/, "State must be in uppercase letters"),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .regex(postcodeRegex, "Please enter a valid postal code")
    .refine((val) => postcodeMap[val] !== undefined, "Postcode not found"),
});

export const accountUsersSchema = z.object({
  users: z
    .array(userDetailsSchema)
    .min(1, "At least one user is required")
    .refine(
      (users) => users.some((user) => user.roles.includes(UserRole.BENEFICIAL_OWNER)),
      "At least one Beneficial Owner is required"
    )
    .refine(
      (users) => users.some((user) => user.roles.includes(UserRole.REPRESENTATIVE)),
      "At least one Representative is required"
    ),
});

export const termsSchema = z.object({
  acceptedBillPay: z.boolean().refine((val) => val === true, {
    message: "You must accept the Bill Pay Agreement",
  }),
  acceptedCardProgram: z.boolean().refine((val) => val === true, {
    message: "You must accept the Card Program Agreement",
  }),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept all terms and conditions",
  }),
});

// Combine all schemas into the main schema
export const schema = z.object({
  ...companyDetailsSchema.shape,
  ...companyAccountSchema.shape,
  ...accountUsersSchema.shape,
  ...termsSchema.shape,
});

export type FormData = z.infer<typeof schema>;
