"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import AddFundsModal from "@/components/account-contract/add-funds";
import WithdrawFundsModal from "@/components/account-contract/withdraw-funds";
import { FundCard } from "@/components/generics/card-account";

export default function AccountOverview() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("1W");

  const { available, pending, spent, isLoading } = useAccountContracts();

  const totalExpenses = pending + spent;
  const income = available + pending + spent;
  const totalFunds = income + totalExpenses;

  return (
    <Card className="w-full max-w-7xl mx-auto bg-charyo-500/0">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FundCard
            title="Income"
            amount={income}
            description="The funds settled to your account this period."
            color="primary"
            isLoading={isLoading}
          />
          <FundCard       
            title="Available"
            amount={available}
            description="The funds available to you on demand."
            color="success"
            isLoading={isLoading}
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
          />
          <FundCard
            title="Expenses"
            amount={totalExpenses}
            description="Your card expenses for the period."
            color="danger"
            isLoading={isLoading}
          />
        </div>
      </CardBody>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
    </Card>
  );
}