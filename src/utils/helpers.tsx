import { createIcon } from "opepen-standard";

export const isLocal = process.env.NEXT_PUBLIC_NODE_ENV === "development";
export const isTesting = process.env.NEXT_PUBLIC_NODE_ENV === "ci";
export const isStaging = process.env.NEXT_PUBLIC_NODE_ENV === "staging";
export const isProduction = process.env.NEXT_PUBLIC_NODE_ENV === "production";

export function formatBalance(balance: number, currency: string): string {
  return `${mapCurrencyToSymbol[currency]} ${balance.toFixed(2)} ${currency.toUpperCase()}`;
}

export const mapCurrencyToSymbol: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  cad: "$",
  aud: "$",
  nzd: "$",
};

export function getOpepenAvatar(address: string, size: number): string {
  const canvas = createIcon({
    seed: address,
    size,
  });

  return canvas.toDataURL();
}

export const centsToDollars = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

export const formattedDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return date.toLocaleString("en-GB", options);
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
};

export const getFullName = (firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`;
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
  }).format(value);
};

export const formatAmountUSD = (value: number) => {
  return new Intl.NumberFormat("en-US", { currency: "USD" }).format(value);
};

export const formatDecimals = (value: string): string => {
  const [whole, decimal = ""] = value.split(".");
  const truncatedDecimal = decimal.slice(0, 2).padEnd(2, "0");

  return `${whole}.${truncatedDecimal}`;
};
