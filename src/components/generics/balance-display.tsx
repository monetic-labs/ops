import { formatUSD } from "@/utils/formatters/currency";

interface BalanceDisplayProps {
  balance: number;
  onClick?: () => void;
  className?: string;
  prefix?: string;
}

export function BalanceDisplay({ 
  balance, 
  onClick, 
  className = "text-sm text-gray-400 hover:text-white",
  prefix = "Balance: "
}: BalanceDisplayProps) {
  return (
    <button onClick={onClick} className={`${className} transition-colors`}>
      {prefix}{formatUSD(balance)}
    </button>
  );
} 