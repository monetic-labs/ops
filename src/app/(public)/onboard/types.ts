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
    companyEmail: "",
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
      return ["users"];
    case 4:
      return ["users"];
    case 5:
      return ["acceptedTerms"];
    default:
      return [];
  }
};
