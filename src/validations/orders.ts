import { z } from "zod";

import { isLocal, formatPhoneNumber, capitalizeFirstChar } from "@/utils/helpers";

// Add validation patterns
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
const amountRegex = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/;

export enum FieldLabel {
  EMAIL = "Email",
  PHONE = "Phone",
  AMOUNT = "Amount",
}

export const orderSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .max(100, "Email address is too long")
    .regex(emailRegex, "Please enter a valid email address"),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform((val) => {
      const digits = val.replace(/\D/g, "");

      return formatPhoneNumber(digits);
    })
    .refine((val) => phoneRegex.test(val), "Please enter a valid phone number in format (XXX) XXX-XXXX"),

  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((val) => {
      const cleanValue = val.replace(/[^\d.]/g, "");
      const numericValue = parseFloat(cleanValue);

      return !isNaN(numericValue);
    }, "Please enter a valid amount")
    .refine(
      (val) => {
        const cleanValue = val.replace(/[^\d.]/g, "");
        const amount = parseFloat(cleanValue);
        const minAmount = isLocal ? 0.01 : 1;

        return !isNaN(amount) && amount >= minAmount;
      },
      (val) => ({
        message: `Amount must be at least ${isLocal ? "$0.01" : "$1.00"}`,
      })
    )
    .refine((val) => {
      const cleanValue = val.replace(/[^\d.]/g, "");
      const amount = parseFloat(cleanValue);

      return !isNaN(amount) && amount <= 1000000;
    }, "Amount cannot exceed $1,000,000"),
});

// Helper function to check if a field is optional in the schema
const isFieldOptional = (fieldPath: string) => {
  try {
    const pathParts = fieldPath.split(".");
    let currentSchema: any = orderSchema;

    for (const part of pathParts) {
      if (currentSchema.shape) {
        currentSchema = currentSchema.shape[part];
      }
    }

    return currentSchema instanceof z.ZodOptional;
  } catch (e) {
    return false;
  }
};

type FieldValidationInput = {
  label: FieldLabel;
  value?: string;
  fieldPath?: string;
};

type FieldValidationOutput = {
  isInvalid: boolean;
  errorMessage?: string;
  isRequired?: boolean;
};

const getZodFieldValidation = (schema: z.ZodType, value: unknown, fieldPath: string): FieldValidationOutput => {
  const isRequired = !isFieldOptional(fieldPath);

  if (!value && isRequired) {
    return {
      isInvalid: true,
      errorMessage: `${capitalizeFirstChar(fieldPath)} is required`,
      isRequired,
    };
  }

  if (!value) {
    return {
      isInvalid: false,
      errorMessage: undefined,
      isRequired,
    };
  }

  const result = schema.safeParse(value);

  return {
    isInvalid: !result.success,
    errorMessage: result.success ? undefined : result.error.errors[0]?.message,
    isRequired,
  };
};

export function getValidationProps({ label, value, fieldPath }: FieldValidationInput): FieldValidationOutput {
  let schema;
  let path = fieldPath || label.toLowerCase();

  switch (label) {
    case FieldLabel.EMAIL:
      schema = orderSchema.shape.email;
      break;
    case FieldLabel.PHONE:
      schema = orderSchema.shape.phone;
      break;
    case FieldLabel.AMOUNT:
      schema = orderSchema.shape.amount;
      break;
    default:
      return { isInvalid: false, isRequired: true };
  }

  return getZodFieldValidation(schema, value, path);
}

export type OrderFormData = z.infer<typeof orderSchema>;
