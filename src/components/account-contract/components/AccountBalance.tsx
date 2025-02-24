import type { Account } from "@/types/account";
import { formatUSD } from "@/utils/helpers";

import { Button } from "@nextui-org/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface AccountBalanceProps {
  account: Account;
  onSend: () => void;
  onReceive: () => void;
}

export function AccountBalance({ account, onSend, onReceive }: AccountBalanceProps) {
  if (!account.isDeployed) {
    return (
      <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-sm text-warning mb-1">Account Not Activated</p>
            <p className="text-3xl md:text-4xl font-semibold mt-1 text-foreground/40">$0.00</p>
            <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto opacity-50">
            <Button
              className="flex-1 md:flex-none h-11 bg-content3 text-foreground px-6"
              startContent={<ArrowUpRight className="w-4 h-4" />}
              isDisabled
            >
              Send
            </Button>
            <Button
              className="flex-1 md:flex-none h-11 bg-content3 text-foreground px-6"
              startContent={<ArrowDownLeft className="w-4 h-4" />}
              isDisabled
            >
              Receive
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-sm text-foreground/60">Available Balance</p>
          <p className="text-3xl md:text-4xl font-semibold mt-1">{formatUSD(account.balance)}</p>
          <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            className="flex-1 md:flex-none h-11 bg-primary/10 text-primary hover:bg-primary/20 px-6"
            startContent={<ArrowUpRight className="w-4 h-4" />}
            onPress={onSend}
          >
            Send
          </Button>
          <Button
            className="flex-1 md:flex-none h-11 bg-primary/10 text-primary hover:bg-primary/20 px-6"
            startContent={<ArrowDownLeft className="w-4 h-4" />}
            onPress={onReceive}
          >
            Receive
          </Button>
        </div>
      </div>
    </div>
  );
}
