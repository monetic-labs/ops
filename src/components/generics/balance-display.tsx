import { Button } from "@nextui-org/button";
import { formatUSD } from "@/utils/formatters/currency";

interface BalanceDisplayProps {
  balance: number;
  onClick?: () => void;
}

export function BalanceDisplay({ balance, onClick }: BalanceDisplayProps) {
  if (!onClick) {
    return <span className="text-sm text-foreground/60">{formatUSD(balance)}</span>;
  }

  return (
    <Button
      className="text-sm text-foreground/60 hover:text-foreground hover:bg-content3 transition-colors p-1 h-auto min-w-0"
      variant="light"
      onPress={onClick}
    >
      {formatUSD(balance)} (max)
    </Button>
  );
}
