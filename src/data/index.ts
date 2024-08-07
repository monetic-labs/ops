
export const cards = [
    {
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

export const cardsColumns = [
    { name: "CARD NAME", uid: "cardName" },
    { name: "HOLDER", uid: "holder" },
    { name: "TYPE", uid: "type" },
    { name: "STATUS", uid: "status" },
    { name: "LIMIT", uid: "limit" },
    { name: "ACTIONS", uid: "actions" },
  ];

  export const usersColumns = [
    { name: "NAME", uid: "name" },
    { name: "ROLE", uid: "role" },
    { name: "EMAIL", uid: "email" },
    { name: "STATUS", uid: "status" },
    { name: "ACTIONS", uid: "actions" },
  ];

  export const users = [
    {
      name: "Rick Sanchez",
      role: "Admin",
      email: "rick.sanchez@example.com",
      status: "Active",
      actions: "Actions",
    },
    {
      name: "Morty Smith",
      role: "Bookkeeper",
      email: "morty.smith@example.com",
      status: "Active",
      actions: "modal",
    },
    {
      name: "Summer Smith",
      role: "Developer",
      email: "summer.smith@example.com",
      status: "Inactive",
      actions: "modal",
    },
    {
      name: "Beth Smith",
      role: "Member",
      email: "beth.smith@example.com",
      status: "Suspended",
      actions: "modal",
    },
  ];

  // ... existing imports and data ...

  export interface BillPay {
    id: string;
    vendor: string;
    internalNote: string;
    memo: string;
    status: string;
    amount: string;
    fees: string;
    paymentMethod: 'ACH' | 'Wire' | 'SWIFT' | 'SEPA' | 'Stable';
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
  
  export const billPayColumns = [
    { name: "VENDOR", uid: "vendor" },
    { name: "INTERNAL NOTE", uid: "internalNote" },
    { name: "MEMO", uid: "memo" },
    { name: "STATUS", uid: "status" },
    { name: "AMOUNT", uid: "amount" },
    { name: "FEES", uid: "fees" },
    { name: "ACTIONS", uid: "actions" },
  ];

export const billPayData: BillPay[] = [
  {
    id: "1",
    vendor: "Acme, LTD",
    internalNote: "ai-generated-note",
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
      memo: "Invoice #12345"
    }
  },
  {
    id: "2",
    vendor: "Design Contractor",
    internalNote: "ai-generated-note",
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
      memo: "Project #98765"
    }
  },
  {
    id: "3",
    vendor: "UPS Shipping Account",
    internalNote: "ai-generated-note",
    memo: "Physical",
    status: "Inactive",
    amount: "$5000",
    fees: "$100",
    paymentMethod: "SWIFT",
    currency: "EUR",
    transactionCost: 50,
    settlementTime: "3-5 business days",
    receivingBank: {
      name: "Deutsche Bank",
      routingNumber: "DEUTDEFF",
      accountNumber: "DE89370400440532013000",
      memo: "Shipping Invoice #54321"
    }
  },
];

export const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

// ... rest of the existing data ...