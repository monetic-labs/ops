import { TransactionListItem } from "@backpack-fux/pylon-sdk";

export interface Column<T> {
  name: string;
  uid: keyof T;
}

export interface BillPay {
  id: string;
  vendor: string;
  internalNote: string;
  memo: string;
  status: string;
  amount: string;
  fees: string;
  paymentMethod: "ACH" | "Wire" | "SWIFT" | "SEPA" | "Stable";
  currency: string;
  transactionCost: number;
  settlementTime: string;
  receivingBank: {
    name: string;
    routingNumber: string;
    accountNumber: string;
    memo: string;
  };
}

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
  name: string;
  role: string;
  email: string;
  status: string;
  actions: string;
}

export const billPayColumns: readonly Column<BillPay>[] = [
  { name: "VENDOR", uid: "vendor" },
  { name: "STATUS", uid: "status" },
  { name: "AMOUNT", uid: "amount" },
  { name: "MEMO", uid: "memo" },
  { name: "INTERNAL NOTE", uid: "internalNote" },
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

export const paymentsColumns: Column<TransactionListItem>[] = [
  { name: "ID", uid: "id" },
  { name: "Status", uid: "transactionStatusHistory" }, // We'll use this to get the latest status
  { name: "Payment Method", uid: "paymentMethod" },
  { name: "Total", uid: "total" },
  { name: "Created", uid: "createdAt" },
] as const;

export const usersColumns: readonly Column<User>[] = [
  { name: "NAME", uid: "name" },
  { name: "ROLE", uid: "role" },
  { name: "EMAIL", uid: "email" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
] as const;

export const billPayData: BillPay[] = [
  {
    id: "1",
    vendor: "Acme, LTD",
    internalNote: "supplies",
    memo: "",
    status: "Active",
    amount: "$10,000.00",
    fees: "$200.00",
    paymentMethod: "ACH",
    currency: "USD",
    transactionCost: 25,
    settlementTime: "2-3 business days",
    receivingBank: {
      name: "Bank of America",
      routingNumber: "026009593",
      accountNumber: "1234567890",
      memo: "Invoice #12345",
    },
  },
  {
    id: "2",
    vendor: "Design Contractor",
    internalNote: "marketing",
    memo: "",
    status: "Active",
    amount: "$10,000.00",
    fees: "$200.00",
    paymentMethod: "Wire",
    currency: "USD",
    transactionCost: 35,
    settlementTime: "1-2 business days",
    receivingBank: {
      name: "Chase Bank",
      routingNumber: "021000021",
      accountNumber: "0987654321",
      memo: "Project #98765",
    },
  },
  {
    id: "3",
    vendor: "UPS Shipping Account",
    internalNote: "fullfilment operations",
    memo: "Physical",
    status: "Inactive",
    amount: "$5000.00",
    fees: "$100.00",
    paymentMethod: "SWIFT",
    currency: "EUR",
    transactionCost: 50,
    settlementTime: "3-5 business days",
    receivingBank: {
      name: "Deutsche Bank",
      routingNumber: "DEUTDEFF",
      accountNumber: "DE89370400440532013000",
      memo: "Shipping Invoice #54321",
    },
  },
];

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

export const userData: User[] = [
  {
    id: "1",
    name: "Rick Sanchez",
    role: "Admin",
    email: "rick.sanchez@example.com",
    status: "Active",
    actions: "Actions",
  },
  {
    id: "2",
    name: "Morty Smith",
    role: "Bookkeeper",
    email: "morty.smith@example.com",
    status: "Active",
    actions: "modal",
  },
  {
    id: "3",
    name: "Summer Smith",
    role: "Developer",
    email: "summer.smith@example.com",
    status: "Inactive",
    actions: "modal",
  },
  {
    id: "4",
    name: "Beth Smith",
    role: "Member",
    email: "beth.smith@example.com",
    status: "Suspended",
    actions: "modal",
  },
];

export const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export const paymentsStatusColorMap: Record<string, "success" | "warning" | "danger" | "primary" | "secondary"> = {
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

export const usersStatusColorMap: Record<string, "success" | "danger" | "warning"> = {
  Active: "success",
  Inactive: "danger",
  Suspended: "warning",
};
