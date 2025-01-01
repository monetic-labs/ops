export const formatUSD = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const formatNumericInput = (value: string) => {
  const numericValue = value.replace(/[^\d.]/g, "");
  const parts = numericValue.split(".");

  if (parts.length > 2 || parts[1]?.length > 2) return undefined;

  if (numericValue === "" || /^\d*\.?\d{0,2}$/.test(numericValue)) {
    const formattedValue = [
      parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ""),
      parts[1]
    ].filter(Boolean).join(".");

    return value.endsWith(".") ? formattedValue + "." : formattedValue;
  }

  return undefined;
};

export const displayAmount = (amount: string) => {
  return amount
    ? amount
        .split(".")
        .map((part, index) => (index === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : part))
        .join(".")
    : "";
}; 