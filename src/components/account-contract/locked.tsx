"use client";

import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { useState } from "react";

import WithdrawFundsModal from "@/components/account-contract/withdraw-funds";
import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";

export default function LockedCard() {
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const { totalLocked, isLoading } = useAccountContracts();

  return (
    <>
      <Card className="flex-grow bg-charyo-500/60">
        <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
          <p className="text-tiny uppercase font-bold">Locked</p>
          <small className="text-default-500">Amount staked in your account to use</small>
        </CardHeader>
        <CardBody className="py-2">
          <h4 className="font-bold text-large pb-2">
          {isLoading ? "Loading..." : `$${totalLocked.toFixed(2)}`}
          </h4>
          <div className="flex gap-2">
            <Button
              className="w-full bg-charyo-200 text-notpurple-500"
              size="sm"
              onPress={() => setIsWithdrawFundsOpen(true)}
            >
              Withdraw
            </Button>
          </div>
        </CardBody>
      </Card>

      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
    </>
  );
}