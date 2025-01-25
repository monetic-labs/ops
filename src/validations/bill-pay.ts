import { z } from "zod";
import { DisbursementMethod, ISO3166Alpha2State, ISO3166Alpha3Country } from "@backpack-fux/pylon-sdk";

import { BASE_USDC } from "@/utils/constants";
import { isLocal } from "@/utils/helpers";
import { NewBillPay } from "@/types/bill-pay";
import { ExistingBillPay } from "@/types/bill-pay";

export enum FieldLabel {
  ACCOUNT_HOLDER = "Account Holder",
  ACCOUNT_NUMBER = "Account Number",
  AMOUNT = "Amount",
  BANK_NAME = "Bank Name",
  PAYMENT_METHOD = "Method",
  ROUTING_NUMBER = "Routing Number",
  // address labels
  STREET_LINE_1 = "Street Line 1",
  STREET_LINE_2 = "Street Line 2",
  CITY = "City",
  STATE = "State",
  ZIP = "Zip Code",
  COUNTRY = "Country",
  MEMO = "Memo",
}

export const MINIMUM_DISBURSEMENT_WIRE_AMOUNT = isLocal ? 0.1 : 500; // USD denominated
export const MINIMUM_DISBURSEMENT_ACH_AMOUNT = isLocal ? 0.1 : 100; // USD denominated

type FieldValidationInput = {
  label: FieldLabel;
  currency: string;
  balance?: string;
  value?: string;
  method?: DisbursementMethod;
};

type FieldValidationOutput = {
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  isInvalid: boolean;
  isDisabled?: boolean;
  errorMessage?: string;
};

export const existingBillPaySchema = z.object({
  type: z.literal("existing"),
  vendorName: z
    .string()
    .min(1, "Account holder name is required")
    .max(50, "Account holder name must be less than 50 characters"),
  vendorBankName: z.string().min(1, "Bank name is required").max(30, "Bank name must be less than 30 characters"),
  vendorMethod: z.nativeEnum(DisbursementMethod),
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 digits")
    .max(17, "Account number must be less than 17 digits"),
  routingNumber: z
    .string()
    .length(9, "Routing number must be 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        if (!val || val === "") return false;
        const amount = parseFloat(val);

        if (isNaN(amount)) return false;
        const minAmount = isLocal ? 0.1 : 1;

        return amount >= minAmount;
      },
      `Amount must be at least ${isLocal ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
    ),
  currency: z.string(),
  disbursementId: z.string().min(1, "Disbursement ID is required"),
  memo: z
    .string()
    .regex(/^[A-Za-z0-9 ]*$/, "Cannot contain special characters")
    .optional(),
});

export const newBillPaySchema = z.object({
  type: z.literal("new"),
  vendorName: z
    .string()
    .trim()
    .min(1, "Account holder name is required")
    .max(50, "Account holder name must be less than 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Account holder name can only contain letters, spaces, hyphens and apostrophes"),

  vendorBankName: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(30, "Bank name must be less than 30 characters")
    .regex(/^[A-Za-z0-9\s&'-]+$/, "Bank name can only contain letters, numbers, spaces, &, hyphens and apostrophes"),

  vendorMethod: z.nativeEnum(DisbursementMethod, {
    errorMap: () => ({ message: "Please select a valid payment method" }),
  }),

  accountNumber: z
    .string()
    .trim()
    .min(5, "Account number must be at least 5 digits")
    .max(17, "Account number must be less than 17 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),

  routingNumber: z
    .string()
    .trim()
    .length(9, "Routing number must be 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers")
    .refine((val) => {
      // Add ABA routing number checksum validation
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += parseInt(val[i]) * [3, 7, 1, 3, 7, 1, 3, 7, 1][i];
      }

      return sum % 10 === 0;
    }, "Invalid routing number checksum"),

  amount: z
    .string()
    .trim()
    .refine((val) => !isNaN(parseFloat(val)), "Amount must be a valid number")
    .refine(
      (val) => {
        const amount = parseFloat(val || "0");
        const minAmount = isLocal ? 0.1 : 1;

        return amount >= minAmount;
      },
      `Amount must be at least ${isLocal ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
    )
    .refine((val) => {
      const decimals = val.split(".")[1]?.length || 0;

      return decimals <= 2;
    }, "Amount cannot have more than 2 decimal places"),

  currency: z.string().min(1, "Currency is required"),

  memo: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\s]*$/, "Cannot contain special characters")
    .optional(),

  address: z.object({
    street1: z
      .string()
      .trim()
      .min(1, "Street address is required")
      .max(100, "Street address must be less than 100 characters")
      .regex(
        /^[A-Za-z0-9\s,.-]+$/,
        "Street address can only contain letters, numbers, spaces, commas, periods, and hyphens"
      ),

    street2: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9\s,.-]*$/, "Can only contain letters, numbers, spaces, commas, periods, and hyphens")
      .max(100, "Street address line 2 must be less than 100 characters")
      .optional(),

    city: z
      .string()
      .trim()
      .min(1, "City is required")
      .max(50, "City must be less than 50 characters")
      .regex(/^[A-Za-z\s.-]+$/, "City can only contain letters, spaces, periods, and hyphens"),

    state: z.nativeEnum(ISO3166Alpha2State, {
      errorMap: () => ({ message: "Please select a valid state" }),
    }),

    postcode: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"),

    country: z.nativeEnum(ISO3166Alpha3Country, {
      errorMap: () => ({ message: "Please select a valid country" }),
    }),
  }),
});

const getZodFieldValidation = (
  schema: z.ZodType,
  value: unknown,
  field?: FieldLabel,
  balance?: string
): FieldValidationOutput => {
  if (!value) {
    return {
      isInvalid: false,
      errorMessage: undefined,
      ...(field === FieldLabel.AMOUNT && {
        step: 0.01,
        description: balance ? `Available balance: ${balance} ${BASE_USDC.SYMBOL}` : "Fetching balance...",
      }),
    };
  }

  const result = schema.safeParse(value);

  return {
    isInvalid: !result.success,
    errorMessage: result.success ? undefined : result.error.errors[0]?.message,
    ...(field === FieldLabel.AMOUNT && {
      step: 0.01,
      description: balance ? `Available balance: ${balance} ${BASE_USDC.SYMBOL}` : "Fetching balance...",
    }),
  };
};

export function getValidationProps({ label, value, currency, balance, method }: FieldValidationInput) {
  let schema;

  switch (label) {
    case FieldLabel.ACCOUNT_HOLDER:
      schema = newBillPaySchema.shape.vendorName;
      break;
    case FieldLabel.BANK_NAME:
      schema = newBillPaySchema.shape.vendorBankName;
      break;
    case FieldLabel.ACCOUNT_NUMBER:
      schema = newBillPaySchema.shape.accountNumber;
      break;
    case FieldLabel.ROUTING_NUMBER:
      schema = newBillPaySchema.shape.routingNumber;
      // TODO: check routing number is unique against existing disbursement contacts
      break;
    case FieldLabel.PAYMENT_METHOD:
      schema = newBillPaySchema.shape.vendorMethod;
      // TODO: check account number is unique against existing disbursement contacts
      break;
    case FieldLabel.AMOUNT:
      const getMinimumAmount = (method?: DisbursementMethod) => {
        switch (method) {
          case DisbursementMethod.WIRE:
            return MINIMUM_DISBURSEMENT_WIRE_AMOUNT;
          case DisbursementMethod.ACH_SAME_DAY:
            return MINIMUM_DISBURSEMENT_ACH_AMOUNT;
          default:
            return MINIMUM_DISBURSEMENT_ACH_AMOUNT;
        }
      };

      schema = z
        .string()
        .min(1, "Amount is required")
        .refine(
          (val) => {
            if (!val || val === "") return false;
            const amount = parseFloat(val);

            if (isNaN(amount)) return false;
            const minAmount = getMinimumAmount(method);

            return amount >= minAmount;
          },
          (val) => ({
            message: `Amount must be at least ${getMinimumAmount(method)} ${BASE_USDC.SYMBOL}`,
          })
        )
        .refine((val) => {
          const amount = parseFloat(val);
          const maxAmount = balance ? parseFloat(balance) : 0;

          return amount <= maxAmount;
        }, `Amount must be less than ${balance} ${BASE_USDC.SYMBOL}`)
        .refine((val) => {
          const decimals = val.split(".")[1]?.length || 0;

          return decimals <= 2;
        }, "Amount cannot have more than 2 decimal places");
      break;
    case FieldLabel.STREET_LINE_1:
      const validateWireAddress = (val: string, method?: DisbursementMethod) => {
        if (method === DisbursementMethod.WIRE && !/^\d+\s/.test(val)) {
          return false;
        }

        return true;
      };

      schema = z
        .string()
        .min(1, "Street address is required")
        .max(100, "Street address must be less than 100 characters")
        .refine(
          (val) => validateWireAddress(val, method),
          "US wire transfers require a street number at the start of the address"
        )
        .refine((val) => !/^\s/.test(val), "Street address cannot start with a space");
      break;
    case FieldLabel.STREET_LINE_2:
      schema = newBillPaySchema.shape.address.shape.street2;
      break;
    case FieldLabel.CITY:
      schema = newBillPaySchema.shape.address.shape.city;
      break;
    case FieldLabel.STATE:
      schema = newBillPaySchema.shape.address.shape.state;
      break;
    case FieldLabel.ZIP:
      schema = newBillPaySchema.shape.address.shape.postcode;
      break;
    case FieldLabel.COUNTRY:
      schema = newBillPaySchema.shape.address.shape.country;
      break;
    case FieldLabel.MEMO:
      const getMaxLength = (method?: DisbursementMethod) => {
        return method === DisbursementMethod.WIRE ? 35 : 10;
      };

      schema = z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9\s]*$/, "Cannot contain special characters")
        .refine(
          (val) => {
            const maxLength = getMaxLength(method);

            return val.length <= maxLength;
          },
          (val) => ({
            message: `Must be less than ${getMaxLength(method)} characters`,
          })
        );
      break;
    default:
      schema = z.string();
  }

  return getZodFieldValidation(schema, value, label, balance);
}

export const validateBillPay = (billPay: NewBillPay | ExistingBillPay, balance?: string): boolean => {
  const schema = billPay.type === "new" ? newBillPaySchema : existingBillPaySchema;

  const amountSchema = z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        if (!val || val === "") return false;
        const amount = parseFloat(val);

        if (isNaN(amount)) return false;
        const minAmount = isLocal ? 0.1 : 1;

        return amount >= minAmount;
      },
      `Amount must be at least ${isLocal ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
    )
    .refine((val) => {
      const amount = parseFloat(val);
      const maxAmount = balance ? parseFloat(balance) : 0;

      return amount <= maxAmount;
    }, `Amount must be less than ${balance} ${BASE_USDC.SYMBOL}`);

  const result = schema
    .extend({
      amount: amountSchema,
    })
    .safeParse(billPay);

  return result.success;
};
