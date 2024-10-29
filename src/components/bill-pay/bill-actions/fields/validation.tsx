import { isLocal } from "@/utils/helpers";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";

type FieldValidation = {
  min?: number;
  max?: number;
  step?: number;
  isInvalid: boolean;
  errorMessage: string;
};

export enum FieldLabels {
  ACCOUNT_HOLDER = "Account Holder",
  ACCOUNT_NUMBER = "Account Number",
  AMOUNT = "Amount",
  BANK_NAME = "Bank Name",
  PAYMENT_METHOD = "Method",
  ROUTING_NUMBER = "Routing Number",
}

export const getFieldValidation = (label: FieldLabels, currency: string, value?: string): FieldValidation => {
  if (value === "" || !value) {
    return { isInvalid: false, errorMessage: "" };
  }
  switch (label) {
    case FieldLabels.ACCOUNT_HOLDER: {
      const minLength = 1;
      const maxLength = 50;
      const isInvalidAccountHolder = value.length < minLength || value.length > maxLength;
      const errorMessageAccountHolder = `Account Holder must be between ${minLength} and ${maxLength} characters`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidAccountHolder,
        errorMessage: errorMessageAccountHolder,
      };
    }
    case FieldLabels.ACCOUNT_NUMBER: {
      const minLength = 5;
      const maxLength = 17;
      const isInvalidAccountNumber = value.length < minLength || value.length > maxLength;
      const errorMessageAccountNumber = `Account Number must be between ${minLength} and ${maxLength} digits`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidAccountNumber,
        errorMessage: errorMessageAccountNumber,
      };
    }
    case FieldLabels.AMOUNT: {
      const minAmount = isLocal ? 0.1 : 1;
      const isInvalidAmount = parseFloat(value) < minAmount;
      const errorMessageAmount = `Amount must be greater than ${minAmount} ${currency}`;
      return { min: minAmount, step: 0.01, isInvalid: isInvalidAmount, errorMessage: errorMessageAmount };
    }
    case FieldLabels.BANK_NAME: {
      const minLength = 1;
      const maxLength = 50;
      const isInvalidBankName = value.length < minLength || value.length > maxLength;
      const errorMessageBankName = `Bank Name must be between ${minLength} and ${maxLength} characters`;
      return { min: minLength, max: maxLength, isInvalid: isInvalidBankName, errorMessage: errorMessageBankName };
    }
    case FieldLabels.PAYMENT_METHOD: {
      const isInvalidMethod = !Object.values(DisbursementMethod).includes(value as DisbursementMethod);
      const errorMessageMethod = `Method must be a valid value`;
      return { isInvalid: isInvalidMethod, errorMessage: errorMessageMethod };
    }
    case FieldLabels.ROUTING_NUMBER: {
      const minLength = 9;
      const maxLength = 9;
      const routingNumberPattern = /^[0-9]+$/;
      const isInvalidRoutingNumber =
        value.length !== minLength || value.length !== maxLength || !routingNumberPattern.test(value);
      const errorMessageRoutingNumber = `Routing Number must be ${minLength} digits and contain only numbers`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidRoutingNumber,
        errorMessage: errorMessageRoutingNumber,
      };
    }
    // Add more cases for other input fields
    default:
      return { isInvalid: false, errorMessage: "" };
  }
};
