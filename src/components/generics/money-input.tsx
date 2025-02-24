import { Input } from "@nextui-org/input";

import { formatNumericInput, displayAmount } from "@/utils/helpers";

export interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  isError?: boolean;
  className?: string;
}

export function MoneyInput({ value, onChange, isError, className }: MoneyInputProps) {
  const handleChange = (value: string) => {
    const formatted = formatNumericInput(value);

    if (formatted !== undefined) {
      onChange(formatted);
    }
  };

  return (
    <Input
      classNames={{
        base: className || "flex-1",
        input: `text-3xl font-light bg-transparent ${
          isError ? "text-danger" : "text-foreground"
        } selection:bg-primary/20 caret-primary`,
        inputWrapper: "bg-transparent shadow-none h-14 p-0",
      }}
      inputMode="decimal"
      placeholder="0.00"
      startContent={
        <div className="pointer-events-none flex items-center">
          <span className={`text-3xl font-light ${isError ? "text-danger" : "text-foreground/60"}`}>$</span>
        </div>
      }
      type="text"
      value={displayAmount(value)}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
