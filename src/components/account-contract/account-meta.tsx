"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";

import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import AddFundsModal from "@/components/account-contract/modal-add-funds";
import WithdrawFundsModal from "@/components/account-contract/modal-withdraw-funds";
import { FundCard } from "@/components/generics/card-account";

import PortfolioModal from "./modal-portfolio";

export default function AccountOverview() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  const { available, pending, spent, isLoading } = useAccountContracts();

  const totalExpenses = pending + spent;
  const income = available + pending + spent;
  const totalFunds = income + totalExpenses;

  return (
    <Card className="w-full max-w-7xl mx-auto bg-charyo-500/0">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center" />
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FundCard
            actions={[
              {
                label: "Summary",
                onClick: () => setIsPortfolioOpen(true),
                color: "success",
              },
            ]}
            amount={income}
            color="primary"
            description="The funds settled to your account this period."
            isLoading={isLoading}
            title="Income"
          />
          <FundCard
            actions={[
              {
                label: "Add Funds",
                onClick: () => setIsAddFundsOpen(true),
                color: "success",
              },
              {
                label: "Withdraw",
                onClick: () => setIsWithdrawFundsOpen(true),
                color: "primary",
              },
            ]}
            amount={available}
            color="success"
            description="The funds available to you on demand."
            isLoading={isLoading}
            title="Available"
          />
          <FundCard
            amount={totalExpenses}
            color="danger"
            description="Your card expenses for the period."
            isLoading={isLoading}
            title="Expenses"
          />
        </div>
      </CardBody>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
    </Card>
  );
}
