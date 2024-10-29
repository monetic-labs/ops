import { BASE_USDC } from "@/utils/constants";
import { isLocal } from "@/utils/helpers";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { NewBillPay } from "../create";

type FieldValidationInput = {
  label: FieldLabels;
  currency: string;
  balance?: string;
  value?: string;
};

type FieldValidationOutput = {
  min?: number;
  max?: number;
  step?: number;
  description?: string;
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

export const getFieldValidation = ({
  label,
  currency,
  balance,
  value,
}: FieldValidationInput): FieldValidationOutput => {
  if (!balance) {
    return { isInvalid: false, errorMessage: "Fetching balance..." };
  }

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
      const maxAmount = balance ? parseFloat(balance) : 0;
      const isInvalidAmount = parseFloat(value) < minAmount || parseFloat(value) > maxAmount;
      const errorMessageAmount = `Amount must be between ${minAmount} and ${maxAmount} ${BASE_USDC.SYMBOL}`;
      const description = `You have ${balance} ${BASE_USDC.SYMBOL} available in your account`;
      return {
        min: minAmount,
        max: maxAmount,
        step: 0.01,
        isInvalid: isInvalidAmount,
        errorMessage: errorMessageAmount,
        description,
      };
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

export const validateBillPay = (billPay: NewBillPay, balance?: string): boolean => {
  // Check required fields are present
  const requiredFields = [
    billPay.vendorName,
    billPay.vendorBankName,
    billPay.accountNumber,
    billPay.vendorMethod,
    billPay.amount,
  ];

  if (requiredFields.some((field) => !field)) {
    return false;
  }

  // Validate each field using existing getFieldValidation
  const validations = {
    accountHolder: getFieldValidation({
      label: FieldLabels.ACCOUNT_HOLDER,
      value: billPay.vendorName,
      currency: billPay.currency,
    }),
    bankName: getFieldValidation({
      label: FieldLabels.BANK_NAME,
      value: billPay.vendorBankName,
      currency: billPay.currency,
    }),
    accountNumber: getFieldValidation({
      label: FieldLabels.ACCOUNT_NUMBER,
      value: billPay.accountNumber,
      currency: billPay.currency,
    }),
    paymentMethod: getFieldValidation({
      label: FieldLabels.PAYMENT_METHOD,
      value: billPay.vendorMethod,
      currency: billPay.currency,
    }),
    amount: getFieldValidation({
      label: FieldLabels.AMOUNT,
      value: billPay.amount,
      currency: billPay.currency,
      balance,
    }),
  };

  return Object.values(validations).every((result) => !result.isInvalid);
};
