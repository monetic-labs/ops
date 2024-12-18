// mappers/rainMapper.ts

import {
  RainAddress,
  RainPerson,
  RainEntity,
  RainInitialUser,
  MerchantRainCompanyCreateInput,
} from "@backpack-fux/pylon-sdk";

import {
  CompanyAccountSchema,
  CompanyDetailsSchema,
  CompanyAccountUsersSchema,
  CompanyUserDetailsSchema,
} from "@/types/validations/onboard";

function formatSSN(ssn: string): string {
  return ssn.replace(/-/g, "");
}

export function mapToRainMerchantCreateDto(
  accountData: CompanyAccountSchema,
  detailsData: CompanyDetailsSchema,
  usersData: CompanyAccountUsersSchema,
  userDetailsData: CompanyUserDetailsSchema,
  additionalData: {
    isTermsOfServiceAccepted: boolean;
    expectedSpend: string;
    id: string;
  }
): MerchantRainCompanyCreateInput {
  const { company } = accountData;
  const { walletAddress, companyEIN, companyType, companyDescription } = detailsData;
  const { representatives } = usersData;
  const { userDetails } = userDetailsData;

  // Map company registered address to RainAddressDto
  const companyAddress: RainAddress = {
    line1: company.registeredAddress.street1,
    line2: company.registeredAddress.street2,
    city: company.registeredAddress.city,
    region: company.registeredAddress.state,
    postalCode: company.registeredAddress.postcode,
    countryCode: company.registeredAddress.country,
    country: company.registeredAddress.country,
  };

  // Map entity data to RainEntityDto
  const entity: RainEntity = {
    name: company.name,
    type: companyType,
    description: companyDescription,
    taxId: companyEIN,
    website: company.website,
    expectedSpend: additionalData.expectedSpend,
  };

  // We use role to map which user object but the service doesn't want it, we use this to manage that
  type RainPersonWithRole = RainPerson & {
    role: "owner" | "representative" | "beneficial-owner";
  };

  // Map representatives to RainPersonDto[]
  const rainRepresentatives: RainPersonWithRole[] = representatives.map((rep, index) => {
    const userDetail = userDetails[index]; // Assuming the order matches

    return {
      id: additionalData.id,
      firstName: rep.firstName,
      lastName: rep.lastName,
      birthDate: userDetail.birthday,
      nationalId: formatSSN(userDetail.ssn),
      countryOfIssue: userDetail.countryOfIssue,
      email: rep.email,
      address: {
        line1: userDetail.registeredAddress.street1,
        line2: userDetail.registeredAddress.street2,
        city: userDetail.registeredAddress.city,
        region: userDetail.registeredAddress.state,
        postalCode: userDetail.registeredAddress.postcode,
        countryCode: userDetail.registeredAddress.country,
        country: userDetail.registeredAddress.country,
      },
      role: rep.role as "owner" | "representative" | "beneficial-owner",
    };
  });

  // Map the initial user (first representative)
  const initialUser: RainInitialUser = {
    ...rainRepresentatives[0], // Use the first representative's data
    isTermsOfServiceAccepted: additionalData.isTermsOfServiceAccepted,
    role: representatives[0].role,
    walletAddress: walletAddress,
  };

  const ultimateBeneficialOwners: RainPerson[] = rainRepresentatives
    .filter((rep) => rep.role === "beneficial-owner")
    .map(({ role, ...rest }) => rest); // Exclude 'role' from the final DTOs

  let representativesWithoutRole: RainPerson[] = rainRepresentatives
    .filter((rep) => rep.role === "representative" || rep.role === "owner")
    .map(({ role, ...rest }) => rest);

  // If there are no representatives, use the initial user as a representative
  if (representatives.length === 0) {
    const { isTermsOfServiceAccepted, role, walletAddress, ...initialUserWithoutExtra } = initialUser;

    representativesWithoutRole = [initialUserWithoutExtra];
  }
  // Construct the final RainMerchantCreateDto object
  const rainMerchantCreateDto: MerchantRainCompanyCreateInput = {
    initialUser,
    address: companyAddress,
    entity,
    name: company.name,
    representatives: representativesWithoutRole,
    ultimateBeneficialOwners,
  };

  return rainMerchantCreateDto;
}
