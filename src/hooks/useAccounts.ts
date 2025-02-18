import { useState } from "react";
import { Building2, CreditCard, PlusCircle, PiggyBank } from "lucide-react";

import { Account, Operator, TransferActivity } from "@/types/account";
import { useAccounts as useAuthAccounts } from "@/contexts/AccountContext";
import { PersonRole } from "@backpack-fux/pylon-sdk";

// Add mock available operators
const MOCK_AVAILABLE_OPERATORS: Operator[] = [
  {
    name: "John Doe",
    address: "0x1234567890123456789012345678901234567890",
    role: PersonRole.ADMIN,
    image: "",
  },
  {
    name: "Jane Smith",
    address: "0x1234567890123456789012345678901234567893",
    role: PersonRole.MEMBER,
    image: "",
  },
  {
    name: "Bob Wilson",
    address: "0x1234567890123456789012345678901234567894",
    role: PersonRole.SUPER_ADMIN,
    image: "",
  },
  {
    name: "Alice Brown",
    address: "0x1234567890123456789012345678901234567895",
    role: PersonRole.SUPER_ADMIN,
    image: "",
  },
];

// Temporary mock data until we have real implementation
const MOCK_ACCOUNTS: Account[] = [
  {
    address: "0x1234567890123456789012345678901234567891",
    name: "Settlement",
    currency: "USD",
    balance: 456104.2,
    icon: Building2,
    isEnabled: false,
    threshold: 1,
    operators: [MOCK_AVAILABLE_OPERATORS[1]],
    recentActivity: [
      {
        id: "0x1234567890123456789012345678901234567890",
        type: "sent",
        status: "completed",
        amount: 1000,
        timestamp: new Date(),
        from: {
          address: "0x1234567890123456789012345678901234567890",
          name: "John Doe",
        },
        to: {
          address: "0x1234567890123456789012345678901234567890",
          name: "John Doe",
        },
        operators: [],
        requiredSignatures: 1,
        currentSignatures: 1,
      },
    ],
    pendingActivity: [],
    isDisabled: false,
    isComingSoon: false,
    isCreateAccount: false,
  },
  {
    address: "0x1234567890123456789012345678901234567892",
    name: "Rain Card",
    currency: "USD",
    balance: 31383.43,
    icon: CreditCard,
    isEnabled: false,
    threshold: 1,
    operators: [
      {
        name: "Settlement Account",
        address: "0x1234567890123456789012345678901234567891",
        image: "",
        hasSigned: false,
      },
    ],
    recentActivity: [],
    pendingActivity: [],
    isDisabled: false,
    isComingSoon: false,
    isCreateAccount: false,
  },
  {
    address: `0xdeadbeef-${crypto.randomUUID()}`,
    name: "Savings",
    currency: "USD",
    balance: 0,
    icon: PiggyBank,
    isEnabled: false,
    threshold: 0,
    operators: [],
    recentActivity: [],
    pendingActivity: [],
    isDisabled: true,
    isComingSoon: true,
    isCreateAccount: false,
  },
  {
    address: `0xdeadbeef-${crypto.randomUUID()}`,
    name: "New Account",
    currency: "USD",
    balance: 0,
    icon: PlusCircle,
    isEnabled: false,
    threshold: 0,
    operators: [],
    recentActivity: [],
    pendingActivity: [],
    isDisabled: true,
    isComingSoon: true,
    isCreateAccount: true,
  },
];

export function useAccounts() {
  const { user } = useAuthAccounts();
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const getEnabledAccounts = () => accounts.filter((account) => !account.isDisabled);

  const deployAccount = (accountId: string, operators: Operator[], threshold: number) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((account) =>
        account.address === accountId ? { ...account, isEnabled: true, operators, threshold } : account
      )
    );
  };

  const updateAccount = (accountId: string, updatedAccount: Account) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => (account.address === accountId ? { ...account, ...updatedAccount } : account))
    );
  };

  const getAvailableOperators = () => MOCK_AVAILABLE_OPERATORS;

  return {
    accounts,
    selectedAccount,
    setSelectedAccount,
    totalBalance: totalBalance.toString(),
    getEnabledAccounts,
    getAvailableOperators,
    user,
    deployAccount,
  };
}
