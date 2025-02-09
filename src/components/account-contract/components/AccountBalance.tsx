import { Button } from "@nextui-org/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Account } from "@/contexts/AccountContext";

interface AccountBalanceProps {
  account: Account;
  onSend: () => void;
  onReceive: () => void;
}

export function AccountBalance({ account, onSend, onReceive }: AccountBalanceProps) {
  return (
    <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-sm text-foreground/60">Available Balance</p>
          <p className="text-3xl md:text-4xl font-semibold mt-1">${account.balance?.toLocaleString()}</p>
          <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            className="flex-1 md:flex-none h-11 bg-content3 hover:bg-content4 text-foreground px-6"
            startContent={<ArrowUpRight className="w-4 h-4" />}
            onPress={onSend}
          >
            Send
          </Button>
          <Button
            className="flex-1 md:flex-none h-11 bg-content3 hover:bg-content4 text-foreground px-6"
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
