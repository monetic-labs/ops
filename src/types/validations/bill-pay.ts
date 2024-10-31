import { z } from "zod";
import { BASE_USDC } from "@/utils/constants";
import { isLocal } from "@/utils/helpers";
import {
  DisbursementMethod,
  ISO3166Alpha2Country,
  ISO3166Alpha2State,
  ISO3166Alpha3Country,
} from "@backpack-fux/pylon-sdk";
import { NewBillPay } from "../bill-pay";
import { ExistingBillPay } from "../bill-pay";

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
  errorMessage?: string;
};

export const existingBillPaySchema = z.object({
  type: z.literal("existing"),
  vendorName: z
    .string()
    .min(1, "Account holder name is required")
    .max(50, "Account holder name must be less than 50 characters")
    .optional(), // Make optional
  vendorBankName: z
    .string()
    .min(1, "Bank name is required")
    .max(30, "Bank name must be less than 30 characters")
    .optional(), // Make optional
  vendorMethod: z.nativeEnum(DisbursementMethod).optional(), // Make optional
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 digits")
    .max(17, "Account number must be less than 17 digits")
    .optional(), // Make optional
  routingNumber: z
    .string()
    .length(9, "Routing number must be 9 digits")
    .regex(/^[0-9]+$/, "Routing number must contain only numbers")
    .optional(), // Make optional
  amount: z
    .string()
    .refine(
      (val) => {
        const amount = parseFloat(val);
        const minAmount = isLocal ? 0.1 : 1;
        return amount >= minAmount;
      },
      `Amount must be at least ${isLocal ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
    )
    .optional(), // Make optional
  currency: z.string(),
  disbursementId: z.string().min(1, "Disbursement ID is required").optional(), // Make optional
  memo: z
    .string()
    .regex(/^[A-Za-z0-9 ]*$/, "Cannot contain special characters")
    .refine(
      (val) => {
        const isWire = val.startsWith("WIRE_");
        const maxLength = isWire ? 35 : 10;
        return val.length <= maxLength;
      },
      (val) => ({
        message: `Must be less than ${val.startsWith("WIRE_") ? 35 : 10} characters`,
      })
    )
    .optional(),
});

export const newBillPaySchema = z.object({
  type: z.literal("new"),
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
  amount: z.string().refine(
    (val) => {
      const amount = parseFloat(val || "0");
      const minAmount = isLocal ? 0.1 : 1;
      return amount >= minAmount;
    },
    `Amount must be at least ${isLocal ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
  ),
  currency: z.string(),
  memo: z
    .string()
    .regex(/^[A-Za-z0-9 ]*$/, "Cannot contain special characters")
    .refine(
      (val) => {
        const isWire = val.startsWith("WIRE_");
        const maxLength = isWire ? 35 : 10;
        return val.length <= maxLength;
      },
      (val) => ({
        message: `Must be less than ${val.startsWith("WIRE_") ? 35 : 10} characters`,
      })
    )
    .optional(),
  address: z.object({
    street1: z
      .string()
      .min(1, "Street address is required")
      .max(100, "Street address must be less than 100 characters"),
    street2: z.string().max(100, "Street address line 2 must be less than 100 characters").optional(),
    city: z.string().min(1, "City is required").max(50, "City must be less than 50 characters"),
    state: z.nativeEnum(ISO3166Alpha2State, {
      errorMap: () => ({ message: "Please select a valid state" }),
    }),
    postcode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"),
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
  if (!value || value === "") {
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
      schema = newBillPaySchema.shape.amount.refine((val) => {
        const amount = parseFloat(val || "0");
        const maxAmount = balance ? parseFloat(balance) : 0;
        return amount <= maxAmount;
      }, `Amount must be less than ${balance} ${BASE_USDC.SYMBOL}`);
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
        );
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
      schema = newBillPaySchema.shape.memo;
      break;
    default:
      schema = z.string();
  }

  return getZodFieldValidation(schema, value, label, balance);
}

export const validateBillPay = (billPay: NewBillPay | ExistingBillPay, balance?: string): boolean => {
  const schema = billPay.type === "new" ? newBillPaySchema : existingBillPaySchema;

  const result = schema
    .extend({
      amount: z.string().refine((val) => {
        const amount = parseFloat(val || "0");
        const maxAmount = balance ? parseFloat(balance) : 0;
        return amount <= maxAmount;
      }, `Amount must be less than ${balance} ${BASE_USDC.SYMBOL}`),
    })
    .safeParse(billPay);

  return result.success;
};
