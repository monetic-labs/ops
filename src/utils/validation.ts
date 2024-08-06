import { countryCodes } from "@/types";

export function formatAmount(value: string): string {
  const numericValue = value.replace(/[^0-9.]/g, "");
  const parts = numericValue.split(".");

  return parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : "");
}

export function validateAmount(
  value: string,
  allowZero: boolean = false,
): string {
  if (value === "") return "";
  const numValue = parseFloat(value);

  if (isNaN(numValue)) return "Invalid amount";
  if (!allowZero && numValue < 30) return "Amount must be at least $30";
  if (allowZero && numValue < 0) return "Amount must be non-negative";

  return "";
}

export function formatName(value: string): string {
  const words = value.split(" ");
  const formattedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );

  return formattedWords.join(" ");
}

export function validateName(value: string): string {
  if (value.length < 2) return "Name must be at least 2 characters long";
  if (!/^[a-zA-Z\s]*$/.test(value))
    return "Name should only contain letters and spaces";

  return "";
}

export function validateEmail(value: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";

  return "";
}

export function validatePhone(value: string): string {
  const supportedCountryCodes = Object.values(countryCodes).map(
    (cc) => cc.areaCode,
  );
  const countryCode = supportedCountryCodes.find((cc) => value.startsWith(cc));

  if (!countryCode) {
    return "Unsupported country code";
  }

  if (countryCode !== "+1") {
    return "Only +1 country code is currently supported";
  }

  const phoneRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;

  if (!phoneRegex.test(value)) {
    return "Invalid phone number format. Use: +1 (XXX) XXX-XXXX";
  }

  return "";
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) return "";

  if (digits.length <= 1) return `+${digits}`;

  if (digits.length <= 4) return `+1 (${digits.slice(1)}`;

  if (digits.length <= 7)
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4)}`;

  return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

export function validateOrderID(value: string): string {
  if (!/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value)) return "Invalid order ID";

  return "";
}
