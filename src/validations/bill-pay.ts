import { z } from "zod";
import { DisbursementMethod, ISO3166Alpha2State, ISO3166Alpha3Country, FiatCurrency } from "@monetic-labs/sdk";

import { BASE_USDC } from "@/utils/constants";
import { isProduction } from "@/utils/helpers";
import { NewBillPay } from "@/types/bill-pay";
import { ExistingBillPay } from "@/types/bill-pay";
import postcodeMap from "@/data/postcodes-map.json";

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

export const MINIMUM_DISBURSEMENT_WIRE_AMOUNT = !isProduction ? 0.1 : 1000; // USD denominated
export const MINIMUM_DISBURSEMENT_ACH_AMOUNT = !isProduction ? 0.1 : 500; // USD denominated

type FieldValidationInput = {
  label: FieldLabel;
  currency: string;
  balance?: string;
  value?: string;
  method?: DisbursementMethod;
};

export type FieldValidationOutput = {
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
        const minAmount = !isProduction ? 0.1 : 1;

        return amount >= minAmount;
      },
      `Amount must be at least ${!isProduction ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
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
        const minAmount = !isProduction ? 0.1 : 1;
        return amount >= minAmount;
      },
      `Amount must be at least ${!isProduction ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
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
      .min(3, "Street address must be at least 3 characters")
      .max(35, "Street address cannot exceed 35 characters")
      .refine((val) => !/^\s/.test(val), "Street address cannot start with a space")
      .refine((val) => !/P(OST)?.?O(FFICE)?.?\s*BOX/i.test(val), "PO Boxes are not allowed")
      .refine((val) => !/PMB/i.test(val), "PMBs are not allowed")
      .refine((val) => /^\d+\s/.test(val), "US addresses must start with a street number (e.g., 123 Main St)"),

    street2: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9\s,.-]*$/, "Can only contain letters, numbers, spaces, commas, periods, and hyphens")
      .max(35, "Street address line 2 cannot exceed 35 characters")
      .refine((val) => !/P(OST)?.?O(FFICE)?.?\s*BOX/i.test(val), "PO Boxes are not allowed")
      .refine((val) => !/PMB/i.test(val), "PMBs are not allowed")
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
      .regex(/^\d{5}$/, "Please enter a valid 5-digit US ZIP code")
      .refine((val) => postcodeMap[val as keyof typeof postcodeMap] !== undefined, "Invalid US ZIP code"),

    country: z.literal(ISO3166Alpha3Country.USA, {
      errorMap: () => ({ message: "Only US addresses are currently supported" }),
    }),
  }),
});

const getZodFieldValidation = (
  schema: z.ZodType,
  value: unknown,
  field?: FieldLabel,
  balance?: string
): FieldValidationOutput => {
  const result = schema.safeParse(value);

  const description =
    field === FieldLabel.AMOUNT
      ? balance
        ? `Available balance: ${parseFloat(balance).toFixed(2)} ${BASE_USDC.SYMBOL}`
        : "Fetching balance..."
      : undefined;

  return {
    isInvalid: !result.success,
    errorMessage: result.success ? undefined : result.error.errors[0]?.message,
    ...(field === FieldLabel.AMOUNT && { step: 0.01 }),
    description,
  };
};

export function getValidationProps({
  label,
  value,
  currency,
  balance,
  method,
}: FieldValidationInput): FieldValidationOutput {
  let schema: z.ZodTypeAny | undefined;

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
      break;
    case FieldLabel.PAYMENT_METHOD:
      schema = newBillPaySchema.shape.vendorMethod;
      break;
    case FieldLabel.AMOUNT:
      const getMinimumAmount = (m?: DisbursementMethod) => {
        switch (m) {
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
        .refine((val) => !isNaN(parseFloat(val)), "Amount must be a valid number")
        .refine(
          (val) => {
            const amount = parseFloat(val || "0");
            const minAmount = getMinimumAmount(method);
            return amount >= minAmount;
          },
          (val) => ({
            message: `Amount must be at least ${getMinimumAmount(method).toFixed(2)} ${BASE_USDC.SYMBOL}`,
          })
        )
        .refine((val) => {
          if (!balance) return true;
          const amount = parseFloat(val);
          const maxAmount = parseFloat(balance);
          return amount <= maxAmount;
        }, `Amount must not exceed available balance`)
        .refine((val) => {
          const decimals = val.split(".")[1]?.length || 0;
          return decimals <= 2;
        }, "Amount cannot have more than 2 decimal places");
      break;
    case FieldLabel.STREET_LINE_1:
      schema = newBillPaySchema.shape.address.shape.street1;
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
      const getMaxLength = (m?: DisbursementMethod) => (m === DisbursementMethod.WIRE ? 35 : 10);
      schema = z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9\s]*$/, "Cannot contain special characters")
        .max(getMaxLength(method), `Must be less than ${getMaxLength(method)} characters`)
        .optional();
      break;
    default:
      console.warn("No validation schema found for label:", label);
      return { isInvalid: false };
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
        const minAmount = !isProduction ? 0.1 : 1;

        return amount >= minAmount;
      },
      `Amount must be at least ${!isProduction ? 0.1 : 1} ${BASE_USDC.SYMBOL}`
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
