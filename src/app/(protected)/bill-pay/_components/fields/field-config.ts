import { DisbursementMethod, FiatCurrency, ISO3166Alpha2State } from "@monetic-labs/sdk";
import { getRegion } from "iso3166-helper";
import { LucideIcon } from "lucide-react";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export type FieldCondition = (formValues: Record<string, any>) => boolean;

export interface FieldOption {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export type FieldType = "text" | "number" | "select" | "autocomplete" | "checkbox" | "date" | "textarea";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string | ((values: Record<string, any>) => string);
  helperText?: string;
  defaultValue?: any;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  hideLabel?: boolean;
  className?: string;
  showWhen?: FieldCondition;
  icon?: string;
  options?: FieldOption[] | ((values: Record<string, any>, context?: Record<string, any>) => FieldOption[]);
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  cols?: number;
  autoFocus?: boolean;
  description?: string | ((context: Record<string, any>) => string | undefined);
  transform?: (label: string, values: Record<string, any>) => string;
  maxLength?: number | ((values: Record<string, any>) => number);
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  showWhen?: FieldCondition;
  icon?: string;
  isValid?: (values: Record<string, any>) => boolean;
}

export interface FormConfig {
  sections: FormSection[];
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  isRequired?: boolean;
  placeholder?: string;
  description?: string;
  dependsOn?: string[];
  showWhen?: (values: Record<string, any>) => boolean;
  options?:
    | Array<{ value: string; label: string }>
    | ((values: Record<string, any>) => Array<{ value: string; label: string }>);
  transform?: (value: any) => any;
  pattern?: RegExp;
  min?: number;
  max?: number;
  maxLength?: number;
  icon?: string;
  iconPosition?: "start" | "end";
}

export interface Contact {
  id: string;
  name: string;
  disbursements: Array<{
    method: DisbursementMethod;
  }>;
}

export interface TransferData {}

export const newRecipientSections: FormSection[] = [
  {
    id: "recipientInfo",
    title: "Recipient Information",
    icon: "User",
    fields: [
      {
        name: "vendorName",
        label: "Account Holder",
        type: "text",
        isRequired: true,
        placeholder: "e.g. John Felix Anthony Cena",
      },
      {
        name: "vendorMethod",
        label: "Payment Method",
        type: "select",
        isRequired: true,
        options: Object.values(DisbursementMethod).map((method) => ({
          value: method,
          label: method === DisbursementMethod.ACH_SAME_DAY ? "ACH Same-Day" : "Wire Transfer",
        })),
      },
    ],
    isValid: (values) => !!values.vendorName && !!values.vendorMethod,
  },
  {
    id: "bankingDetails",
    title: "Banking Details",
    icon: "CreditCard",
    fields: [
      {
        name: "vendorBankName",
        label: "Bank Name",
        type: "text",
        isRequired: true,
        placeholder: "e.g. Bank of America",
      },
      {
        name: "routingNumber",
        label: "Routing Number",
        type: "text",
        isRequired: true,
        placeholder: "e.g. 123000848",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        type: "text",
        isRequired: true,
        placeholder: "e.g. 10987654321",
      },
    ],
    isValid: (values) => !!values.vendorBankName && !!values.routingNumber && !!values.accountNumber,
  },
  {
    id: "address",
    title: "Address",
    icon: "MapPin",
    fields: [
      {
        name: "address.street1",
        label: "Street Line 1",
        type: "text",
        isRequired: true,
        placeholder: "1234 Main St",
      },
      {
        name: "address.street2",
        label: "Street Line 2",
        type: "text",
        placeholder: "Apt 4B",
      },
      {
        name: "address.city",
        label: "City",
        type: "text",
        isRequired: true,
        placeholder: "New York",
      },
      {
        name: "address.state",
        label: "State",
        type: "select",
        isRequired: true,
        options: Object.entries(ISO3166Alpha2State).map(([key, value]) => {
          const state = getRegion(`US-${value}`);
          return {
            value,
            label: state || key,
          };
        }),
      },
      {
        name: "address.postcode",
        label: "ZIP Code",
        type: "text",
        isRequired: true,
        placeholder: "10001",
      },
      {
        name: "address.country",
        label: "Country",
        type: "select",
        isRequired: true,
        options: [{ value: "US", label: "United States" }],
      },
    ],
    isValid: (values) => {
      const address = values.address || {};
      return !!address.street1 && !!address.city && !!address.state && !!address.postcode;
    },
  },
  {
    id: "amount",
    title: "Payment Amount",
    icon: "DollarSign",
    fields: [
      {
        name: "amount",
        label: "Amount",
        type: "number",
        isRequired: true,
        placeholder: "0.00",
        description: (context) =>
          context?.settlementBalance
            ? `Available balance: $${parseFloat(context.settlementBalance).toFixed(2)}`
            : undefined,
      },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        isRequired: true,
        options: Object.values(FiatCurrency).map((currency) => ({
          value: currency,
          label: currency,
        })),
      },
      {
        name: "memo",
        label: "Memo",
        type: "text",
        isRequired: false,
        showWhen: (values) => !!values.vendorMethod,
        transform: (label, values) =>
          values.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference",
        placeholder: (values) =>
          values.vendorMethod === DisbursementMethod.WIRE
            ? "Add a message (max 35 characters)"
            : "Add a reference (max 10 characters)",
        maxLength: (values) => (values.vendorMethod === DisbursementMethod.WIRE ? 35 : 10),
      },
    ],
    isValid: (values) => {
      const amount = parseFloat(values.amount || 0);
      return amount > 0 && !!values.currency;
    },
  },
];

export const existingRecipientSections: FormSection[] = [
  {
    id: "recipientSelection",
    title: "Select Recipient",
    icon: "Users",
    fields: [
      {
        name: "existingContactId",
        label: "Recipient",
        type: "autocomplete",
        isRequired: true,
        placeholder: "Please select",
        options: (values: Record<string, any>, context?: Record<string, any>) => {
          return (
            context?.contacts?.map((c: Contact) => ({
              value: c.id,
              label: c.name,
            })) || []
          );
        },
      },
    ],
    isValid: (values: Record<string, any>, context?: Record<string, any>) => {
      return !!values.existingContactId && !!context?.contacts?.some((c: Contact) => c.id === values.existingContactId);
    },
  },
  {
    id: "transferDetails",
    title: "Transfer Details",
    icon: "CreditCard",
    fields: [
      {
        name: "vendorMethod",
        label: "Payment Method",
        type: "select",
        isRequired: true,
        options: (values, context) => {
          const contact = context?.contacts?.find((c: Contact) => c.id === values.existingContactId);
          if (!contact) return [];
          return contact.disbursements.map((d: { method: DisbursementMethod }) => ({
            value: d.method,
            label: d.method === DisbursementMethod.ACH_SAME_DAY ? "ACH Same-Day" : "Wire Transfer",
          }));
        },
        showWhen: (values) => !!values.existingContactId,
      },
      {
        name: "memo",
        label: "Memo",
        type: "text",
        showWhen: (values) => !!values.vendorMethod,
        transform: (label, values) =>
          values.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference",
        placeholder: (values) =>
          values.vendorMethod === DisbursementMethod.WIRE
            ? "Add a message (max 35 characters)"
            : "Add a reference (max 10 characters)",
        maxLength: (values) => (values.vendorMethod === DisbursementMethod.WIRE ? 35 : 10),
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        isRequired: true,
        placeholder: "0.00",
        showWhen: (values) => !!values.vendorMethod,
        description: (context) =>
          context?.settlementBalance
            ? `Available balance: $${parseFloat(context.settlementBalance).toFixed(2)}`
            : undefined,
      },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        isRequired: true,
        showWhen: (values) => !!values.vendorMethod,
        options: Object.values(FiatCurrency).map((currency) => ({
          value: currency,
          label: currency,
        })),
      },
    ],
    isValid: (values) => {
      const amount = parseFloat(values.amount || 0);
      return !!values.vendorMethod && amount > 0 && !!values.currency;
    },
  },
];
