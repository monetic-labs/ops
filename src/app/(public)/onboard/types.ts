import { ISO3166Alpha2Country, PersonRole } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import { UserRole } from "@/validations/onboard/schemas";
import { FormData } from "@/validations/onboard/schemas";

export const getDefaultValues = ({ settlementAddress }: { settlementAddress: Address }): Partial<FormData> => ({
  companyEmail: "",
  acceptedTerms: false,
  settlementAddress,
  users: [
    {
      firstName: "",
      lastName: "",
      email: "",
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
      dashboardRole: PersonRole.SUPER_ADMIN,
    },
  ],
});

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
