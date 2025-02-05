export const tabsConfig = [
  {
    id: "bill-pay",
    label: "Bill Pay",
    content: "Send and manage payments to vendors and service providers.",
  },
  {
    id: "back-office",
    label: "Back Office",
    content: "Manage your payment streams and revenue collection.",
  },
  {
    id: "card-issuance",
    label: "Card Issuance",
    content: "Issue and manage payment cards for your business expenses.",
  },
  {
    id: "users",
    label: "Team Settings",
    content: "Manage your organization's settings like access and roles.",
  },
];

export const cardServicesConfig = [
  {
    id: "transactions",
    label: "Transactions",
  },
  {
    id: "card-list",
    label: "Card List",
  },
];

export const backOfficeConfig = [
  {
    id: "payments",
    label: "Payments",
  },
  {
    id: "order-links",
    label: "Order Links",
  },
  {
    id: "widget-management",
    label: "Widget Management",
  },
];

export enum BillPayId {
  TRANSFERS = "transfers",
  CONTACTS = "contacts",
}

export const billPayConfig: { id: BillPayId; label: string }[] = [
  {
    id: BillPayId.TRANSFERS,
    label: "Transfers",
  },
  {
    id: BillPayId.CONTACTS,
    label: "Contacts",
  },
];
