export type FormField = {
  selector: string;
  value: string;
  validation?: string;
};

export type ValidationTest = {
  value: string;
  validation?: string;
  isValid?: boolean;
};

export type FieldValidations = {
  selector: string;
  tests: ValidationTest[];
};

export const COMPANY_ACCOUNT_VALIDATIONS: FieldValidations[] = [
  {
    selector: "company-account-name",
    tests: [
      {
        value: " ",
        validation: "Company name is required",
      },
      {
        value: "Company@123",
        validation: "Company name can only contain letters, spaces, and hyphens",
      },
      {
        value: "Backpack Network",
        isValid: true,
      },
    ],
  },
  {
    selector: "company-account-email",
    tests: [
      {
        value: "invalid-email",
        validation: "Please enter a valid email address",
      },
      {
        value: "thomas@backpack.network",
        isValid: true,
      },
    ],
  },
];

export const COMPANY_DETAILS_VALIDATIONS: FieldValidations[] = [
  {
    selector: "settlement-address",
    tests: [
      {
        value: "0x123", // too short
        validation: "Invalid Ethereum address",
      },
      {
        value: "0x1234567890123456789012345678901234567890",
        isValid: true,
      },
    ],
  },
  {
    selector: "company-ein",
    tests: [
      {
        value: "123456789",
        validation: "EIN must be in format XX-XXXXXXX",
      },
      {
        value: "12-3456789",
        isValid: true,
      },
    ],
  },
];

export const VALID_ONBOARDING_DATA = {
  companyAccount: {
    name: "Backpack Network",
    email: "thomas@backpack.network",
    website: "backpack.network",
    postcode: "10001",
    city: "New York",
    state: "NY",
    country: "US",
    streetAddress1: "123 Main St",
    streetAddress2: "Suite 100",
  },
  companyDetails: {
    settlementAddress: "0x1234567890123456789012345678901234567890",
    ein: "12-3456789",
    type: "Limited Liability Company (LLC)",
    description: "Test company description",
  },
} as const;
