import { Input } from "@nextui-org/input";

import { formatNumericInput, displayAmount } from "@/utils/formatters/currency";

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  isError?: boolean;
}

export function MoneyInput({ value, onChange, isError }: MoneyInputProps) {
  const handleChange = (value: string) => {
    const formatted = formatNumericInput(value);

    if (formatted !== undefined) {
      onChange(formatted);
    }
  };

  return (
    <Input
      classNames={{
        base: "flex-1",
        input: `text-3xl font-light bg-transparent ${isError ? "text-red-500" : "text-white"}`,
        inputWrapper: "bg-transparent shadow-none h-14 p-0",
      }}
      inputMode="decimal"
      placeholder="0.00"
      startContent={
        <div className="pointer-events-none flex items-center">
          <span className={`text-3xl font-light ${isError ? "text-red-500" : "text-gray-400"}`}>$</span>
        </div>
      }
      type="text"
      value={displayAmount(value)}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
