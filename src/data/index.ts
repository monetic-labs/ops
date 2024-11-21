import {
  DisbursementState,
  FiatCurrency,
  MerchantDisbursementCreateOutput,
  MerchantDisbursementEventGetOutput,
  MerchantUserGetOutput,
  PersonRole,
  StableCurrency,
  TransactionListItem,
  CardLimitFrequency,
  CardShippingMethod,
  CardStatus,
} from "@backpack-fux/pylon-sdk";
import { z } from "zod";

export interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const limitCyclesObject: { label: string; value: CardLimitFrequency }[] = [
  { label: "Day", value: CardLimitFrequency.DAY },
  { label: "Week", value: CardLimitFrequency.WEEK },
  { label: "Month", value: CardLimitFrequency.MONTH },
  { label: "Year", value: CardLimitFrequency.YEAR },
  { label: "All Time", value: CardLimitFrequency.ALL_TIME },
  { label: "Per Authorization", value: CardLimitFrequency.PER_AUTHORIZATION },
];

export const limitStatesObject: { label: string; value: CardStatus }[] = [
  { label: "Not Activated", value: CardStatus.NOT_ACTIVATED },
  { label: "Canceled", value: CardStatus.CANCELLED },
  { label: "Active", value: CardStatus.ACTIVE },
  { label: "Locked", value: CardStatus.LOCKED },
];

export const ISO3166Alpha2Country = z.string().length(2);

export const cardDeliveryCountries: { label: string; value: string }[] = [{ label: "United States", value: "US" }];

export const shippingMethodOptions = [
  { label: "Standard", value: "STANDARD" },
  { label: "Express", value: "EXPRESS" },
  { label: "International", value: "INTERNATIONAL" },
];

export const cardTypes = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

const VALID_STATUSES = [CardStatus.ACTIVE, CardStatus.CANCELLED, CardStatus.LOCKED, CardStatus.NOT_ACTIVATED];
const VALID_FREQUENCIES = [
  CardLimitFrequency.DAY,
  CardLimitFrequency.WEEK,
  CardLimitFrequency.MONTH,
  CardLimitFrequency.YEAR,
  CardLimitFrequency.ALL_TIME,
  CardLimitFrequency.PER_AUTHORIZATION,
];

export const UpateCardSchema = z.object({
  status: z.string().refine(
    (value) => VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]),
    (value) => ({ message: `Please select valid status` })
  ),
  limitAmount: z
    .string()
    .min(1, "Please enter card limit number")
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, "Please enter a valid number for card limit"),
  limitFrequency: z.string().refine(
    (value) => VALID_FREQUENCIES.includes(value as (typeof VALID_FREQUENCIES)[number]),
    (value) => ({ message: `Please select valid limit frequency` })
  ),
});

export const CreateCardSchema = z.object({
  displayName: z.string().min(1, "Enter valid card name"),
  ownerFirstName: z.string().min(1, "Please enter valid first name"),
  ownerLastName: z.string().min(1, "Please enter valid last name"),
  ownerEmail: z.string().email().min(1, "Please enter valid email"),
  limitAmount: z
    .string()
    .min(1, "Please enter card limit number")
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, "Please enter a valid number for card limit"),
  limitFrequency: z.nativeEnum(CardLimitFrequency),
});

const validCountries = ["US"];
const regionsData: Record<string, Array<{ label: string; value: string }>> = {
  US: [
    { label: "Alabama", value: "AL" },
    { label: "Alaska", value: "AK" },
    { label: "Arizona", value: "AZ" },
    { label: "Arkansas", value: "AR" },
    { label: "California", value: "CA" },
    { label: "Colorado", value: "CO" },
    { label: "Connecticut", value: "CT" },
    { label: "Delaware", value: "DE" },
    { label: "Florida", value: "FL" },
    { label: "Georgia", value: "GA" },
    { label: "Hawaii", value: "HI" },
    { label: "Idaho", value: "ID" },
    { label: "Illinois", value: "IL" },
    { label: "Indiana", value: "IN" },
    { label: "Iowa", value: "IA" },
    { label: "Kansas", value: "KS" },
    { label: "Kentucky", value: "KY" },
    { label: "Louisiana", value: "LA" },
    { label: "Maine", value: "ME" },
    { label: "Maryland", value: "MD" },
    { label: "Massachusetts", value: "MA" },
    { label: "Michigan", value: "MI" },
    { label: "Minnesota", value: "MN" },
    { label: "Mississippi", value: "MS" },
    { label: "Missouri", value: "MO" },
    { label: "Montana", value: "MT" },
    { label: "Nebraska", value: "NE" },
    { label: "Nevada", value: "NV" },
    { label: "New Hampshire", value: "NH" },
    { label: "New Jersey", value: "NJ" },
    { label: "New Mexico", value: "NM" },
    { label: "New York", value: "NY" },
    { label: "North Carolina", value: "NC" },
    { label: "North Dakota", value: "ND" },
    { label: "Ohio", value: "OH" },
    { label: "Oklahoma", value: "OK" },
    { label: "Oregon", value: "OR" },
    { label: "Pennsylvania", value: "PA" },
    { label: "Rhode Island", value: "RI" },
    { label: "South Carolina", value: "SC" },
    { label: "South Dakota", value: "SD" },
    { label: "Tennessee", value: "TN" },
    { label: "Texas", value: "TX" },
    { label: "Utah", value: "UT" },
    { label: "Vermont", value: "VT" },
    { label: "Virginia", value: "VA" },
    { label: "Washington", value: "WA" },
    { label: "West Virginia", value: "WV" },
    { label: "Wisconsin", value: "WI" },
    { label: "Wyoming", value: "WY" },
  ],
};

export const getRegionsForCountry = (country: string) => {
  return regionsData[country] || [];
};

export const CardShippingDetailsSchema = z
  .object({
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().refine((value) => validCountries.includes(value as (typeof validCountries)[number]), {
      message: `Please select a country`,
    }),
    phoneNumber: z.string().min(1),
    phoneCountryCode: z.string().min(1).max(3),
    shippingMethod: z.nativeEnum(CardShippingMethod).optional(),
  })
  .superRefine((data, ctx) => {
    const validRegions = getRegionsForCountry(data.country);
    if (!validRegions.find((t) => t.value === data.region)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select valid region",
        path: ["region"],
      });
    }
  });

type StatusColor = "success" | "warning" | "danger" | "primary" | "secondary" | "default" | undefined;

export interface Column<T> {
  name: string;
  uid: keyof T;
}

export type BillPay = Omit<MerchantDisbursementEventGetOutput, "contact"> & MerchantDisbursementCreateOutput;

export interface CardTransactions {
  id: string;
  merchantId: string;
  amount: string;
  spender: string;
  memo: string;
  receipt: string;
  date: string;
  category: string;
  cardName: string;
  cardLastFour: string;
  status: string;
}

export interface IssuedCards {
  id: string;
  cardName: string;
  holder: string;
  type: "Physical" | "Virtual";
  status: "Active" | "Inactive";
  limit: {
    amount: string;
    cycle: string;
  };
  cardNumber: string;
  expDate: string;
  cvv: string;
  billingAddress: string;
  email: string;
}

export interface Payment {
  id: string;
  status: string;
  paymentMethod: string;
  total: string;
  createdAt: string;
  actions: string;
}

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "representative" | "ultimate_beneficiary";
  countryOfIssue?: string;
  birthDate?: string;
  socialSecurityNumber?: string;
  postcode?: string;
  city?: string;
  state?: string;
  streetAddress1?: string;
  streetAddress2?: string;
};

export const billPayColumns: readonly Column<BillPay>[] = [
  { name: "VENDOR", uid: "accountOwnerName" },
  { name: "STATUS", uid: "state" },
  { name: "AMOUNT RECEIVED", uid: "currencyOut" },
  { name: "PAYMENT REFERENCE", uid: "paymentMessage" },
  { name: "TIME OF TRANSFER", uid: "createdAt" },
] as const;

export const contactColumns: readonly Column<MerchantDisbursementCreateOutput>[] = [
  { name: "NAME", uid: "accountOwnerName" },
  { name: "METHODS", uid: "disbursements" },
  { name: "STATUS", uid: "isActive" },
] as const;

export const cardTransactionColumns: readonly Column<CardTransactions>[] = [
  { name: "MERCHANT ID", uid: "merchantId" },
  { name: "AMOUNT", uid: "amount" },
  { name: "SPENDER", uid: "spender" },
  { name: "MEMO", uid: "memo" },
  { name: "RECEIPT", uid: "receipt" },
] as const;

export const issuedCardColumns: readonly Column<IssuedCards>[] = [
  { name: "CARD NAME", uid: "cardName" },
  { name: "HOLDER", uid: "holder" },
  { name: "TYPE", uid: "type" },
  { name: "STATUS", uid: "status" },
  { name: "LIMIT", uid: "limit" },
  //{ name: "ACTIONS", uid: "actions" },
] as const;

export const paymentsColumns: readonly Column<TransactionListItem>[] = [
  { name: "ID", uid: "id" },
  { name: "Status", uid: "transactionStatusHistory" }, // We'll use this to get the latest status
  { name: "Payment Method", uid: "paymentMethod" },
  { name: "Total", uid: "total" },
  { name: "Created", uid: "createdAt" },
] as const;

export const usersColumns: readonly Column<MerchantUserGetOutput>[] = [
  { name: "NAME", uid: "firstName" },
  { name: "ROLE", uid: "role" },
  { name: "EMAIL", uid: "email" },
  { name: "PHONE NUMBER", uid: "phone" },
  { name: "WALLET ADDRESS", uid: "walletAddress" },
] as const;

export const cardTransactionData: CardTransactions[] = [
  {
    id: "1",
    merchantId: "0001",
    amount: "$100.00",
    spender: "Sterling Archer",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
  {
    id: "2",
    merchantId: "0002",
    amount: "$100.00",
    spender: "Sterling Archer",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
  {
    id: "3",
    merchantId: "0003",
    amount: "$100.00",
    spender: "Sterling Archer",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
  // ... add more transactions
];

export const issuedCardData: IssuedCards[] = [
  {
    id: "1",
    cardName: "General Use",
    holder: "Sterling Archer",
    type: "Physical",
    status: "Active",
    limit: {
      amount: "5000",
      cycle: "month",
    },
    cardNumber: "4111111111111111",
    expDate: "12/25",
    cvv: "123",
    billingAddress: "123 Spy Street, New York, NY 10001",
    email: "sterling@isis.com",
  },
  {
    id: "2",
    cardName: "Apple Purchases",
    holder: "Lana Kane",
    type: "Virtual",
    status: "Active",
    limit: {
      amount: "1000",
      cycle: "month",
    },
    cardNumber: "5555555555554444",
    expDate: "03/24",
    cvv: "456",
    billingAddress: "456 Agent Avenue, Los Angeles, CA 90001",
    email: "lana@isis.com",
  },
  {
    id: "3",
    cardName: "Travel Expenses",
    holder: "Cyril Figgis",
    type: "Physical",
    status: "Inactive",
    limit: {
      amount: "3000",
      cycle: "month",
    },
    cardNumber: "3782822463100005",
    expDate: "09/23",
    cvv: "789",
    billingAddress: "789 Accountant Lane, Chicago, IL 60601",
    email: "cyril@isis.com",
  },
];

export const statusColorMap: Record<DisbursementState, StatusColor> = {
  PENDING: "default",
  AWAITING_FUNDS: "secondary",
  COMPLETED: "primary",
  FAILED: "danger",
  IN_REVIEW: "warning",
  FUNDS_RECEIVED: "success",
  PAYMENT_SUBMITTED: "success",
  PAYMENT_PROCESSED: "success",
  CANCELED: "danger",
  ERROR: "danger",
  RETURNED: "danger",
  REFUNDED: "success",
};

export const paymentsStatusColorMap: Record<string, StatusColor> = {
  SENT_FOR_AUTHORIZATION: "primary",
  AUTHORIZED: "secondary",
  SENT_FOR_SETTLEMENT: "warning",
  SETTLED: "success",
  SETTLEMENT_FAILED: "danger",
  CANCELLED: "danger",
  ERROR: "danger",
  EXPIRED: "danger",
  REFUSED: "danger",
  SENT_FOR_REFUND: "warning",
  REFUNDED: "success",
  REFUND_FAILED: "danger",
};

export const usersStatusColorMap: Record<PersonRole, StatusColor> = {
  MEMBER: "primary",
  DEVELOPER: "secondary",
  BOOKKEEPER: "warning",
  ADMIN: "success",
  SUPER_ADMIN: "danger",
};
