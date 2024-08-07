import { createIcon } from "opepen-standard";

import { ChainAddress, OrderID } from "@/types";

export function formatBalance(balance: number, currency: string): string {
  return `${mapCurrencyToSymbol[currency]} ${balance.toFixed(
    2,
  )} ${currency.toUpperCase()}`;
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
  const generateGroup = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

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
