"use client";

import { useState } from "react";
import { Card } from "@nextui-org/card";
import {
  PlusCircleIcon,
  Building2, // For Settlement
  CreditCard, // For Rain Card
  PiggyBank, // For Create Account
} from "lucide-react";

import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import AddFundsModal from "@/components/account-contract/modal-add-funds";
import WithdrawFundsModal from "@/components/account-contract/modal-withdraw-funds";
import PortfolioModal from "@/components/account-contract/modal-portfolio";
import { AccountCard } from "@/components/generics/card-account";
import TransferModal from "@/components/account-contract/modal-transfer";

// TODO: We need to record internal transfers between accounts in a movements/transactions system

export default function AccountOverview() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  const { available, pending, spent, isLoading } = useAccountContracts();

  // const totalExpenses = pending + spent;
  // const income = available + pending + spent;

  // Updated accounts data with icons
  const accounts = [
    {
      id: "settlement",
      name: "Settlement",
      currency: "USD",
      balance: 456104.2,
      icon: Building2,
    },
    {
      id: "rain",
      name: "Rain Card",
      currency: "USD",
      balance: 31383.43,
      icon: CreditCard,
    },
    {
      id: "savings",
      name: "Savings",
      currency: "USD",
      balance: 0,
      disabled: true,
      comingSoon: true,
      icon: PiggyBank,
    },
    {
      id: "new-account",
      name: "New Account",
      currency: "USD",
      disabled: true,
      comingSoon: true,
      isCreateAccount: true,
      icon: PlusCircleIcon,
    },
  ];

  // Calculate totals
  const totalIncome = 12000; // Example value, replace with actual data
  const totalExpenses = 7000; // Example value, replace with actual data
  const netChange = totalIncome - totalExpenses;
  const isPositiveChange = netChange >= 0;

  return (
    <Card className="w-full max-w-7xl mx-auto bg-background/60 dark:bg-background/50">
      {/* Overview Section */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold">Overview</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <AccountCard isTotal subtitle="USD" title="Total Balance" value="$487,487.63" variant="overview" />

          <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-2">
            <AccountCard
              isHoverable
              subtitle="Last 30 days"
              title="Income"
              trend="up"
              trendColor="success"
              value="+$12,000"
              variant="overview"
              onClick={() => setIsPortfolioOpen(true)}
            />
            <AccountCard
              subtitle="Last 30 days"
              title="Expenses"
              trend="down"
              trendColor="danger"
              value="-$7,000"
              variant="overview"
            />
            <AccountCard title="Net Change" trend="up" trendColor="success" value="+$5,000" variant="overview" />
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold">Accounts</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              balance={account.balance}
              comingSoon={account.comingSoon}
              currency={account.currency}
              disabled={account.disabled}
              icon={account.icon}
              isCreateAccount={account.isCreateAccount}
              name={account.name}
              variant="account"
              onClick={() => !account.disabled && !account.isCreateAccount && setIsTransferOpen(true)}
            />
          ))}
        </div>
      </div>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
    </Card>
  );
}
