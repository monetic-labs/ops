import { DisbursementMethod } from "@backpack-fux/pylon-sdk";

export const mockContacts = [
  {
    id: "1",
    accountOwnerName: "John Doe",
    bankName: "Test Bank",
    routingNumber: "123456789",
    accountNumber: "987654321",
    disbursements: [
      {
        id: "disb_1",
        method: DisbursementMethod.ACH_SAME_DAY,
        paymentMessage: "INV1234",
      },
      {
        id: "disb_2",
        method: DisbursementMethod.WIRE,
        paymentMessage: "Payment for Invoice 1234",
      },
    ],
  },
  // Add more mock contacts as needed
];
