import type { Address } from "viem";

import dayjs from "dayjs";
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

export const truncateAddress = (address: Address): string => {
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

// CardCompanyType enum from pylon-sdk
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

export const formatPersonRole = (value: string) => {
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

export const getDisplayName = (firstName: string, lastName: string) => {
  // Full name
  const fullName = `${capitalizeFirstChar(firstName)} ${capitalizeFirstChar(lastName)}`;

  if (fullName.length <= 10) return fullName;

  // First initial + last name
  const initialLastName = `${capitalizeFirstChar(firstName[0])}. ${capitalizeFirstChar(lastName)}`;

  if (initialLastName.length <= 10) return initialLastName;

  // First name only
  if (firstName.length <= 10) return capitalizeFirstChar(firstName);

  // If all else fails, return first initial + last name
  return initialLastName;
};

export const todayStr = dayjs().format("MMM D YYYY hh:mm A");

export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, "");

  // Handle special cases
  if (cleanValue === "" || cleanValue === ".") return "";

  // Ensure only one decimal point
  const parts = cleanValue.split(".");

  if (parts.length > 2) return formatCurrencyInput(parts[0] + "." + parts[1]);

  // Handle decimal places
  if (parts.length === 2) {
    const whole = parts[0];
    const decimal = parts[1].slice(0, 2); // Limit to 2 decimal places

    // Format whole number part with commas
    const formatted = Number(whole).toLocaleString("en-US");

    return `${formatted}${decimal ? "." + decimal : ""}`;
  }

  // Format whole number with commas
  return Number(cleanValue).toLocaleString("en-US");
};

export const parseCurrencyInput = (value: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, "");
  const number = parseFloat(cleanValue);

  return isNaN(number) ? 0 : Number(number.toFixed(2));
};
