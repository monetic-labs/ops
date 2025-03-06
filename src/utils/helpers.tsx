import type { Address } from "viem";

import dayjs from "dayjs";
import { createIcon } from "opepen-standard";

// Environment Constants
export const isLocal = process.env.NEXT_PUBLIC_NODE_ENV === "development";
export const isTesting = process.env.NEXT_PUBLIC_NODE_ENV === "ci";
export const isStaging = process.env.NEXT_PUBLIC_NODE_ENV === "staging";
export const isProduction = process.env.NEXT_PUBLIC_NODE_ENV === "production";

// Currency Formatting and Conversion
export const mapCurrencyToSymbol: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  cad: "$",
  aud: "$",
  nzd: "$",
};

export function formatBalance(balance: number, currency: string): string {
  return `${mapCurrencyToSymbol[currency]} ${balance.toFixed(2)} ${currency.toUpperCase()}`;
}

export const centsToDollars = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

export const formatAmountUSD = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDecimals = (value: string): string => {
  const [whole, decimal = ""] = value.split(".");
  const truncatedDecimal = decimal.slice(0, 2).padEnd(2, "0");
  return `${whole}.${truncatedDecimal}`;
};

// Number Input Formatting
export const formatCurrencyInput = (value: string): string => {
  const cleanValue = value.replace(/[^0-9.]/g, "");
  if (cleanValue === "" || cleanValue === ".") return "";

  const parts = cleanValue.split(".");
  if (parts.length > 2) return formatCurrencyInput(parts[0] + "." + parts[1]);

  if (parts.length === 2) {
    const whole = parts[0];
    const decimal = parts[1].slice(0, 2);
    const formatted = Number(whole).toLocaleString("en-US");
    return `${formatted}${decimal ? "." + decimal : ""}`;
  }

  return Number(cleanValue).toLocaleString("en-US");
};

export const parseCurrencyInput = (value: string): number => {
  const cleanValue = value.replace(/[^0-9.]/g, "");
  const number = parseFloat(cleanValue);
  return isNaN(number) ? 0 : Number(number.toFixed(2));
};

export const formatNumericInput = (value: string) => {
  const numericValue = value.replace(/[^\d.]/g, "");
  const parts = numericValue.split(".");

  if (parts.length > 2 || parts[1]?.length > 2) return undefined;

  if (numericValue === "" || /^\d*\.?\d{0,2}$/.test(numericValue)) {
    const formattedValue = [parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ""), parts[1]].filter(Boolean).join(".");
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

// Date and Time Formatting
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

export const todayStr = dayjs().format("MMM D YYYY hh:mm A");

// Name and Text Formatting
export const getFullName = (firstName: string, lastName: string) => {
  if (!firstName && !lastName) return "User";
  if (!firstName) return lastName;
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const getDisplayName = (firstName: string, lastName: string) => {
  const fullName = `${capitalizeFirstChar(firstName)} ${capitalizeFirstChar(lastName)}`;
  if (fullName.length <= 10) return fullName;

  const initialLastName = `${capitalizeFirstChar(firstName[0])}. ${capitalizeFirstChar(lastName)}`;
  if (initialLastName.length <= 10) return initialLastName;

  if (firstName.length <= 10) return capitalizeFirstChar(firstName);
  return initialLastName;
};

export const formatStringToTitleCase = (value: string) => {
  return value
    .split("_")
    .map((word) => capitalizeFirstChar(word))
    .join(" ");
};

export const capitalizeFirstChar = (value: string) => {
  if (!value) return "";
  if (value.length === 1) return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

// Address and Identification Formatting
export const truncateAddress = (address?: Address | string): string => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}....${address.slice(-4)}`;
};

export const formatPhoneNumber = (value: string, extension?: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `${extension ? `+${extension} ` : ""}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const formatEIN = (value: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};

// Avatar Generation
export function getOpepenAvatar(address: string, size: number): string {
  const canvas = createIcon({
    seed: address,
    size,
  });
  return canvas.toDataURL();
}

// Business Type Formatting
export const formatCompanyType = (value: string) => {
  switch (value) {
    case "sole_proprietorship":
      return "Sole Proprietorship";
    case "llc":
      return "Limited Liability Company (LLC)";
    case "c_corp":
      return "C Corporation";
    case "s_corp":
      return "S Corporation";
    case "partnership":
      return "Partnership";
    case "lp":
      return "Limited Partnership (LP)";
    case "llp":
      return "Limited Liability Partnership (LLP)";
    case "nonprofit":
      return "Nonprofit Corporation";
    default:
      throw new Error("Invalid company type");
  }
};

// Time Formatting
export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return "0s";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && days === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
};
