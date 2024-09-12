import { createIcon } from "opepen-standard";

import { ChainAddress, OrderID } from "@/types";

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

export function generatePlaceholderOrderID(): OrderID {
  const generateGroup = () => Math.floor(1000 + Math.random() * 9000).toString();

  return `${generateGroup()}-${generateGroup()}-${generateGroup()}-${generateGroup()}` as OrderID;
}

export function generatePlaceholderFID(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

export function generatePlaceholderSettlementAddress(): ChainAddress {
  return `0x${Math.random().toString(16).slice(2, 18)}` as ChainAddress;
}

export function getOpepenAvatar(address: string, size: number): string {
  const canvas = createIcon({
    seed: address,
    size,
  });

  return canvas.toDataURL();
}

export const lookupZipCode = async (zipCode: string) => {
  try {
    const response = await fetch(`/api/lookup-zip?zipCode=${zipCode}`);

    if (!response.ok) {
      throw new Error("Zipcode not found");
    }
    const result = await response.json();

    // Ensure the state and country are in the correct format
    return {
      ...result,
      state: result.state,
      country: result.country,
    };
  } catch (error) {
    console.error("Error looking up zip code:", error);
    throw error;
  }
};

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
