"use client";

import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { useState } from "react";

import AddFundsModal from "@/components/account-contract/add-funds";
//import WithdrawFundsModal from "@/components/account-contract/withdraw-funds";

export default function AvailableCard() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const balance = "$5,000.00";

  return (
    <>
      <Card className="flex-grow bg-charyo-500/60">
        <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
          <p className="text-tiny uppercase font-bold">Available</p>
          <small className="text-default-500">Available to spend or withdraw</small>
        </CardHeader>
        <CardBody className="py-2">
          <h4 className="font-bold text-large pb-2">{balance}</h4>
          <div className="flex gap-2">
            <Button
              className="w-full bg-charyo-200 text-notpurple-500"
              size="sm"
              onPress={() => setIsAddFundsOpen(true)}
            >
              Add Funds
            </Button>
          </div>
        </CardBody>
      </Card>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />

      
    </>
  );
}
