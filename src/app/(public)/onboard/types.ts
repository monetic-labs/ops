import { ISO3166Alpha2Country, PersonRole } from "@backpack-fux/pylon-sdk";

import { UserRole } from "@/validations/onboard/schemas";
import { FormData } from "@/validations/onboard/schemas";

interface OnboardingToken {
  email: string;
  type: string;
  exp: number;
  iat: number;
}

export const getDefaultValues = (email?: string): Partial<FormData> => {
  return {
    companyName: "",
    companyEmail: "",
    companyWebsite: "",
    postcode: "",
    city: "",
    state: "",
    streetAddress1: "",
    streetAddress2: "",
    acceptedTerms: false,
    settlementAddress: undefined,
    users: [
      {
        firstName: "",
        lastName: "",
        email: email || "",
        phoneNumber: {
          extension: "",
          number: "",
        },
        roles: [UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE],
        countryOfIssue: ISO3166Alpha2Country.US,
        birthDate: "",
        socialSecurityNumber: "",
        postcode: "",
        city: "",
        state: "",
        streetAddress1: "",
        streetAddress2: "",
        hasDashboardAccess: true,
        dashboardRole: PersonRole.OWNER,
      },
    ],
  };
};

export const getFieldsForStep = (step: number): (keyof FormData)[] => {
  switch (step) {
    case 1:
      return [
        "companyName",
        "companyEmail",
        "companyWebsite",
        "postcode",
        "city",
        "state",
        "streetAddress1",
        "streetAddress2",
      ];
    case 2:
      return ["companyRegistrationNumber", "companyTaxId", "companyType", "companyDescription"];
    case 3:
      // For step 3, we only need to validate basic user info fields
      return ["users"];
    case 4:
      // For step 4, we also validate the user details fields
      return ["users"];
    case 5:
      return ["acceptedTerms"];
    default:
      return [];
  }
};

// Helper to check if fields should be validated on the current step
export const shouldValidateField = (step: number, fieldPath: string): boolean => {
  // For step 3, only validate basic user fields
  if (step === 3) {
    const basicFields = ["firstName", "lastName", "email", "phoneNumber", "roles"];
    return basicFields.some((field) => fieldPath.includes(field));
  }

  // For step 4, validate all user detail fields
  return true;
};
