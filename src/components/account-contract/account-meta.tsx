"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import {
  PlusCircleIcon,
  ArrowUpRight,
  ArrowDownRight,
  Building2, // For Settlement
  CreditCard, // For Rain Card
  PiggyBank, // For Savings
  FolderPlus, // For Create Account
} from "lucide-react";

import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import AddFundsModal from "@/components/account-contract/modal-add-funds";
import WithdrawFundsModal from "@/components/account-contract/modal-withdraw-funds";
import { FundCard } from "@/components/generics/card-account";
import PortfolioModal from "@/components/account-contract/modal-portfolio";
import { AccountCard } from "@/components/generics/card-account";
import TransferModal from "@/components/account-contract/modal-transfer";

// TODO: We need to record internal transfers between accounts in a movements/transactions system

export default function AccountOverview() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

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
          <AccountCard
            variant="overview"
            title="Total Balance"
            value="$487,487.63"
            subtitle="USD"
            isTotal
          />

          <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-2">
            <AccountCard
              variant="overview"
              title="Income"
              value="+$12,000"
              subtitle="Last 30 days"
              trend="up"
              trendColor="success"
            />
            <AccountCard
              variant="overview"
              title="Expenses"
              value="-$7,000"
              subtitle="Last 30 days"
              trend="down"
              trendColor="danger"
            />
            <AccountCard
              variant="overview"
              title="Net Change"
              value="+$5,000"
              trend="up"
              trendColor="success"
            />
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
              variant="account"
              name={account.name}
              icon={account.icon}
              balance={account.balance}
              currency={account.currency}
              disabled={account.disabled}
              comingSoon={account.comingSoon}
              isCreateAccount={account.isCreateAccount}
              onClick={() => 
                !account.disabled && 
                !account.isCreateAccount && 
                setIsTransferOpen(true)
              }
            />
          ))}
        </div>
      </div>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </Card>
  );
}
