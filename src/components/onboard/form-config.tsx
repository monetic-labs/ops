"use client";

import { FormData, UserRole } from "@/validations/onboard/schemas";

// Helper function to get fields for current step
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
      return ["settlementAddress", "companyRegistrationNumber", "companyTaxId", "companyType", "companyDescription"];
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

export const getDefaultValues = (email: string): Partial<FormData> => ({
  companyEmail: email,
  acceptedTerms: false,
  users: [
    {
      firstName: "",
      lastName: "",
      email: email,
      phoneNumber: "",
      roles: [UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE],
      countryOfIssue: "",
      birthDate: "",
      socialSecurityNumber: "",
      postcode: "",
      city: "",
      state: "",
      streetAddress1: "",
      streetAddress2: "",
    },
  ],
});
