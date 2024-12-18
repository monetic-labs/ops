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

export const mockContacts = [
  {
    id: "1",
    accountOwnerName: "John Doe",
    bankName: "Test Bank",
    routingNumber: "123456789",
    accountNumber: "987654321",
    disbursements: [
      {
        id: "disb_1",
        method: "ACH_SAME_DAY",
        paymentMessage: "INV1234",
      },
      {
        id: "disb_2",
        method: "WIRE",
        paymentMessage: "Payment for Invoice 1234",
      },
    ],
  },
  // Add more mock contacts as needed
];

export const MINIMUM_DISBURSEMENT_WIRE_AMOUNT = 500;
export const MINIMUM_DISBURSEMENT_ACH_AMOUNT = 100;

export const VALID_FORM_DATA = {
  accountHolder: "John Doe",
  bankName: "Bank of America",
  accountNumber: "123456789",
  routingNumber: "021000021",
  street1: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "12345",
  country: "United States",
  amount: "150.00",
} as const;

export const ACCOUNT_HOLDER_VALIDATIONS: FieldValidations = {
  selector: "account-holder",
  tests: [
    {
      value: " ",
      validation: "Account holder name is required",
    },
    {
      value: "John@Doe",
      validation: "Account holder name can only contain letters, spaces, hyphens and apostrophes",
    },
    {
      value: "A".repeat(51),
      validation: "Account holder name must be less than 50 characters",
    },
    {
      value: "John-O'Connor Jr",
      isValid: true,
    },
  ],
};

export const BANK_VALIDATIONS: FieldValidations[] = [
  {
    selector: "bank-name",
    tests: [
      {
        value: " ",
        validation: "Bank name is required",
      },
      {
        value: "Bank@123",
        validation: "Bank name can only contain letters, numbers, spaces, &, hyphens and apostrophes",
      },
      {
        value: "Bank of America & Trust",
        isValid: true,
      },
    ],
  },
  {
    selector: "account-number",
    tests: [
      {
        value: "123",
        validation: "Account number must be at least 5 digits",
      },
      {
        value: "12345678901234567890",
        validation: "Account number must be less than 17 digits",
      },
      {
        value: "123456789",
        isValid: true,
      },
    ],
  },
  {
    selector: "routing-number",
    tests: [
      {
        value: "12345678",
        validation: "Routing number must be 9 digits",
      },
      {
        value: "123456789",
        validation: "Invalid routing number checksum",
      },
      {
        value: "021000021",
        isValid: true,
      },
    ],
  },
];

export const ADDRESS_VALIDATIONS: FieldValidations[] = [
  {
    selector: "street-line-1",
    tests: [
      {
        value: " ",
        validation: "Street address cannot start with a space",
      },
      {
        value: "A".repeat(101),
        validation: "Street address must be less than 100 characters",
      },
    ],
  },
  {
    selector: "street-line-2",
    tests: [
      {
        value: "Suite #100",
        validation: "Can only contain letters, numbers, spaces, commas, periods, and hyphens",
      },
      {
        value: "Suite 100",
        isValid: true,
      },
    ],
  },
  {
    selector: "city",
    tests: [
      {
        value: " ",
        validation: "City is required",
      },
      {
        value: "New York123",
        validation: "City can only contain letters, spaces, periods, and hyphens",
      },
      {
        value: "St. Louis",
        isValid: true,
      },
    ],
  },
];
