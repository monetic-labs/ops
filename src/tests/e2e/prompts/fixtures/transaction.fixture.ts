import { TransactionHistory } from "@/knowledge-base/v0/types";

export const mockTransactionHistory: TransactionHistory = {
  averageTransaction: 500,
  recentTransactions: [
    {
      amount: 500,
      method: "instant_transfer",
      timestamp: "2024-03-20T10:00:00Z",
      speed: 1,
      fee: 5.0,
    },
    {
      amount: 1000,
      method: "standard_transfer",
      timestamp: "2024-03-19T15:00:00Z",
      speed: 30,
      fee: 2.5,
    },
  ],
  patterns: {
    preferredMethod: "instant_transfer",
    typicalTimeOfDay: "morning",
    averageFrequency: 3,
    commonRecipients: ["recipient1", "recipient2"],
  },
  stats: {
    totalTransactions: 50,
    totalVolume: 25000,
    averageFee: 3.75,
    averageSpeed: 15,
  },
};
