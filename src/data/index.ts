import {
  DisbursementState,
  FiatCurrency,
  MerchantDisbursementCreateOutput,
  MerchantDisbursementEventGetOutput,
  MerchantUserGetOutput,
  PersonRole,
  StableCurrency,
  TransactionListItem,
} from "@backpack-fux/pylon-sdk";

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
export interface User {
  id: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  actions: string;
}

export const billPayColumns: readonly Column<BillPay>[] = [
  { name: "VENDOR", uid: "accountOwnerName" },
  { name: "STATUS", uid: "state" },
  { name: "AMOUNT RECEIVED", uid: "amountOut" && "currencyOut" },
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
