import { BridgeAddress, DisbursementMethod, FiatCurrency, ISO3166Alpha3Country } from "@backpack-fux/pylon-sdk";

// Base interface with common fields
interface BaseBillPayFields {
  vendorName: string;
  vendorBankName: string;
  vendorMethod?: DisbursementMethod;
  accountHolder?: string;
  routingNumber: string;
  accountNumber: string;
  currency: FiatCurrency;
  amount: string;
  fee: string;
  total: string;
  memo?: string;
}

export interface NewBillPay extends BaseBillPayFields {
  type: "new";
  address: BridgeAddress;
}

export interface ExistingBillPay extends BaseBillPayFields {
  type: "existing";
  disbursementId: string;
}

// Default values
export const DEFAULT_NEW_BILL_PAY: NewBillPay = {
  type: "new",
  vendorName: "",
  vendorMethod: undefined,
  currency: FiatCurrency.USD,
  vendorBankName: "",
  routingNumber: "",
  accountNumber: "",
  memo: "",
  amount: "",
  fee: "",
  total: "",
  address: {
    street1: "",
    street2: "",
    city: "",
    state: undefined,
    postcode: "",
    country: ISO3166Alpha3Country.USA,
  },
};

export const DEFAULT_EXISTING_BILL_PAY: ExistingBillPay = {
  type: "existing",
  vendorName: "",
  vendorMethod: undefined,
  currency: FiatCurrency.USD,
  accountHolder: "",
  routingNumber: "",
  accountNumber: "",
  vendorBankName: "",
  disbursementId: "",
  memo: "",
  amount: "",
  fee: "",
  total: "",
};

// Type guard functions
export function isNewBillPay(billPay: NewBillPay | ExistingBillPay): billPay is NewBillPay {
  return billPay.type === "new";
}

export function isExistingBillPay(billPay: NewBillPay | ExistingBillPay): billPay is ExistingBillPay {
  return billPay.type === "existing";
}
