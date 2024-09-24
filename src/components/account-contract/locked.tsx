import { Card, CardBody, CardHeader } from "@nextui-org/card";

import WithdrawFundsModal from "@/components/account-contract/withdraw-funds";
import { useState } from "react";
import { Button } from "@nextui-org/button";


export default function LockedCard() {
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  
  return (
    <>
      <Card className="flex-grow bg-charyo-500/60">
        <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
        <p className="text-tiny uppercase font-bold">Locked</p>
        <small className="text-default-500">Amount added to the contract this period</small>
      </CardHeader>
      <CardBody className="py-2">
        <h4 className="font-bold text-large">$12,000.00</h4>
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


