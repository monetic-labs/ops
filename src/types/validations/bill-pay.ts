import { BASE_USDC } from "@/utils/constants";
import { isLocal } from "@/utils/helpers";
import { DisbursementMethod, ISO3166Alpha2State, ISO3166Alpha3Country } from "@backpack-fux/pylon-sdk";
import { ExistingBillPay, NewBillPay } from "@/types/bill-pay";

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

export const getFieldValidation = ({
  label,
  currency,
  balance,
  value,
  method,
}: FieldValidationInput): FieldValidationOutput => {
  if (!balance && label === FieldLabel.AMOUNT) {
    return { isInvalid: false, errorMessage: "Fetching balance..." };
  }

  if (value === "" || !value) {
    return { isInvalid: false, errorMessage: "" };
  }
  switch (label) {
    case FieldLabel.ACCOUNT_HOLDER: {
      const minLength = 1;
      const maxLength = 50;
      const isInvalidAccountHolder = value.length < minLength || value.length > maxLength;
      const errorMessageAccountHolder = `Account Holder must be between ${minLength} and ${maxLength} characters`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidAccountHolder,
        errorMessage: isInvalidAccountHolder ? errorMessageAccountHolder : undefined,
      };
    }
    case FieldLabel.ACCOUNT_NUMBER: {
      const minLength = 5;
      const maxLength = 17;
      const isInvalidAccountNumber = value.length < minLength || value.length > maxLength;
      const errorMessageAccountNumber = `Account Number must be between ${minLength} and ${maxLength} digits`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidAccountNumber,
        errorMessage: isInvalidAccountNumber ? errorMessageAccountNumber : undefined,
      };
    }
    case FieldLabel.AMOUNT: {
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
        errorMessage: isInvalidAmount ? errorMessageAmount : undefined,
        description,
      };
    }
    case FieldLabel.BANK_NAME: {
      const minLength = 1;
      const maxLength = 30;
      const isInvalidBankName = value.length < minLength || value.length > maxLength;
      const errorMessageBankName = `Bank Name must be between ${minLength} and ${maxLength} characters`;
      return {
        min: minLength,
        max: maxLength,
        isInvalid: isInvalidBankName,
        errorMessage: isInvalidBankName ? errorMessageBankName : undefined,
      };
    }
    case FieldLabel.PAYMENT_METHOD: {
      const isInvalidMethod = !Object.values(DisbursementMethod).includes(value as DisbursementMethod);
      const errorMessageMethod = `Method must be a valid value`;
      return { isInvalid: isInvalidMethod, errorMessage: isInvalidMethod ? errorMessageMethod : undefined };
    }
    case FieldLabel.ROUTING_NUMBER: {
      const length = 9;
      const routingNumberPattern = /^[0-9]+$/;
      const isInvalidRoutingNumber = value.length !== length || !routingNumberPattern.test(value);
      const errorMessageRoutingNumber = `Routing Number must be ${length} digits and contain only numbers`;
      return {
        min: length,
        max: length,
        isInvalid: isInvalidRoutingNumber,
        errorMessage: isInvalidRoutingNumber ? errorMessageRoutingNumber : undefined,
      };
    }
    case FieldLabel.STREET_LINE_1: {
      const minLength = 1;
      const maxLength = 100;
      const lengthInvalid = value.length < minLength || value.length > maxLength;

      let streetNumberInvalid = false;
      if (method === DisbursementMethod.WIRE) {
        const streetNumberRegex = /^\d+\s/;
        streetNumberInvalid = !streetNumberRegex.test(value);
      }

      const isInvalid = lengthInvalid || streetNumberInvalid;

      return {
        min: minLength,
        max: maxLength,
        isInvalid,
        errorMessage: isInvalid
          ? lengthInvalid
            ? `Street address must be between ${minLength} and ${maxLength} characters`
            : "US wire transfers require a street number at the start of the address"
          : undefined,
      };
    }
    case FieldLabel.STREET_LINE_2: {
      const maxLength = 100;
      const isInvalid = value.length > maxLength;
      return {
        max: maxLength,
        isInvalid,
        errorMessage: isInvalid ? `Street address line 2 must be less than ${maxLength} characters` : undefined,
      };
    }
    case FieldLabel.CITY: {
      const minLength = 1;
      const maxLength = 50;
      const isInvalid = value.length < minLength || value.length > maxLength;
      return {
        min: minLength,
        max: maxLength,
        isInvalid,
        errorMessage: isInvalid ? `City must be between ${minLength} and ${maxLength} characters` : undefined,
      };
    }
    case FieldLabel.STATE: {
      const isInvalid = !Object.values(ISO3166Alpha2State).includes(value as any);
      return {
        isInvalid,
        errorMessage: isInvalid ? "Please select a valid state" : undefined,
      };
    }
    case FieldLabel.ZIP: {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      const isInvalid = !zipRegex.test(value);
      return {
        isInvalid,
        errorMessage: isInvalid ? "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)" : undefined,
      };
    }
    case FieldLabel.COUNTRY: {
      const isInvalid = !Object.values(ISO3166Alpha3Country).includes(value as any);
      return {
        isInvalid,
        errorMessage: isInvalid ? "Please select a valid country" : undefined,
      };
    }
    case FieldLabel.MEMO: {
      const isWire = value.startsWith("WIRE_");
      const maxLength = isWire ? 35 : 10;
      const regex = /^[A-Za-z0-9 ]*$/;
      const isInvalid = !regex.test(value) || value.length > maxLength;
      return {
        max: maxLength,
        isInvalid,
        errorMessage: isInvalid
          ? `Cannot contain special characters and must be less than ${maxLength} characters`
          : undefined,
      };
    }
    default:
      return { isInvalid: false, errorMessage: "" };
  }
};

export const validateBillPay = (billPay: NewBillPay | ExistingBillPay, balance?: string): boolean => {
  // Add debug logging
  console.log("Validating bill pay:", {
    billPay,
    balance,
    type: billPay.type,
  });

  const commonRequiredFields = [billPay.vendorName, billPay.vendorBankName, billPay.vendorMethod, billPay.amount];

  const isNewBillPay = billPay.type === "new";

  if (isNewBillPay) {
    const newBillPayRequiredFields = [
      ...commonRequiredFields,
      billPay.routingNumber,
      billPay.accountNumber,
      billPay.address.street1,
      billPay.address.city,
      billPay.address.state,
      billPay.address.postcode,
      billPay.address.country,
    ];

    if (newBillPayRequiredFields.some((field) => !field)) {
      console.log("New bill pay validation failed:", {
        missingFields: newBillPayRequiredFields.map((field, index) => ({ field, index })).filter(({ field }) => !field),
      });
      return false;
    }
  } else {
    const existingBillPayRequiredFields = [
      ...commonRequiredFields,
      billPay.disbursementId,
      billPay.routingNumber,
      billPay.accountNumber,
    ];

    if (existingBillPayRequiredFields.some((field) => !field)) {
      console.log("Existing bill pay validation failed:", {
        missingFields: existingBillPayRequiredFields.filter((field) => !field),
      });
      return false;
    }
  }

  // Validate each field using existing getFieldValidation
  const validations = {
    accountHolder: getFieldValidation({
      label: FieldLabel.ACCOUNT_HOLDER,
      value: billPay.vendorName,
      currency: billPay.currency,
    }),
    bankName: getFieldValidation({
      label: FieldLabel.BANK_NAME,
      value: billPay.vendorBankName,
      currency: billPay.currency,
    }),
    accountNumber: getFieldValidation({
      label: FieldLabel.ACCOUNT_NUMBER,
      value: billPay.accountNumber,
      currency: billPay.currency,
    }),
    paymentMethod: getFieldValidation({
      label: FieldLabel.PAYMENT_METHOD,
      value: billPay.vendorMethod || "",
      currency: billPay.currency,
    }),
    paymentMemo: billPay.memo
      ? getFieldValidation({
          label: FieldLabel.MEMO,
          value: billPay.memo,
          currency: billPay.currency,
        })
      : { isInvalid: false, errorMessage: "" },
    amount: getFieldValidation({
      label: FieldLabel.AMOUNT,
      value: billPay.amount,
      currency: billPay.currency,
      balance,
    }),
  };

  if (isNewBillPay) {
    Object.assign(validations, {
      streetLine1: getFieldValidation({
        label: FieldLabel.STREET_LINE_1,
        value: billPay.address.street1,
        currency: billPay.currency,
        method: billPay.vendorMethod,
      }),
      streetLine2: billPay.address.street2
        ? getFieldValidation({
            label: FieldLabel.STREET_LINE_2,
            value: billPay.address.street2,
            currency: billPay.currency,
          })
        : { isInvalid: false, errorMessage: "" },
      city: getFieldValidation({
        label: FieldLabel.CITY,
        value: billPay.address.city,
        currency: billPay.currency,
      }),
      state: getFieldValidation({
        label: FieldLabel.STATE,
        value: billPay.address.state,
        currency: billPay.currency,
      }),
      zipCode: getFieldValidation({
        label: FieldLabel.ZIP,
        value: billPay.address.postcode,
        currency: billPay.currency,
      }),
      country: getFieldValidation({
        label: FieldLabel.COUNTRY,
        value: billPay.address.country,
        currency: billPay.currency,
      }),
    });
  }

  const isValid = Object.values(validations).every((result) => !result.isInvalid);

  return isValid;
};
