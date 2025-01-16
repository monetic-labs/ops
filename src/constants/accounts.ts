export const ACCOUNT_TYPES = {
  SETTLEMENT: "settlement",
  RAIN_CARD: "rain",
  SAVINGS: "savings",
  NEW_ACCOUNT: "new-account",
} as const;

export const CURRENCIES = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
} as const;

export const CURRENCY_SYMBOLS = {
  [CURRENCIES.USD]: "$",
  [CURRENCIES.EUR]: "€",
  [CURRENCIES.GBP]: "£",
} as const;
