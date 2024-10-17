// mappers/rainMapper.ts

import {
    CompanyAccountSchema,
    CompanyDetailsSchema,
    CompanyAccountUsersSchema,
    CompanyUserDetailsSchema,
  } from '@/types/validations/onboard';
  import {
    RainPersonDto,
    RainMerchantCreateDto,
    RainInitialUserDto,
    RainEntityDto,
    RainAddressDto,
  } from '@/types/dtos/rainDTO';
  
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
  ): RainMerchantCreateDto {
    const { company } = accountData;
    const { walletAddress, companyEIN, companyType, companyDescription } = detailsData;
    const { representatives } = usersData;
    const { userDetails } = userDetailsData;
  
    // Map company registered address to RainAddressDto
    const companyAddress: RainAddressDto = {
      line1: company.registeredAddress.street1,
      line2: company.registeredAddress.street2,
      city: company.registeredAddress.city,
      region: company.registeredAddress.state || '',
      postalCode: company.registeredAddress.postcode,
      countryCode: company.registeredAddress.country,
      country: company.registeredAddress.country,
    };
  
    // Map entity data to RainEntityDto
    const entity: RainEntityDto = {
      name: company.name,
      type: companyType,
      description: companyDescription,
      taxId: companyEIN,
      website: company.website,
      expectedSpend: additionalData.expectedSpend,
    };

    // We use role to map which user object but the service doesn't want it, we use this to manage that
    type RainPersonWithRole = RainPersonDto & {
        role: "owner" | "representative" | "beneficial-owner";
        //role: string;
    }
  
    // Map representatives to RainPersonDto[]
    const rainRepresentatives: RainPersonWithRole[] = representatives.map((rep, index) => {
      const userDetail = userDetails[index]; // Assuming the order matches
      return {
        id: additionalData.id,
        firstName: rep.firstName,
        lastName: rep.lastName,
        birthDate: userDetail.birthday,
        nationalId: userDetail.ssn,
        countryOfIssue: userDetail.countryOfIssue,
        email: rep.email,
        address: {
          line1: userDetail.registeredAddress.street1,
          line2: userDetail.registeredAddress.street2,
          city: userDetail.registeredAddress.city,
          region: userDetail.registeredAddress.state || '',
          postalCode: userDetail.registeredAddress.postcode,
          countryCode: userDetail.registeredAddress.country,
          country: userDetail.registeredAddress.country,
        },
        role: rep.role as "owner" | "representative" | "beneficial-owner",
      };
    });
  
    // Map the initial user (first representative)
    const initialUser: RainInitialUserDto = {
      ...rainRepresentatives[0], // Use the first representative's data
      //id: additionalData.id,
      isTermsOfServiceAccepted: additionalData.isTermsOfServiceAccepted,
      role: representatives[0].role,
      walletAddress: walletAddress,
    };

    // Ensure we have at least one representative and one ultimate beneficial owner
    let representativesWithoutRole: RainPersonDto[] = rainRepresentatives
    .filter((rep) => rep.role === 'representative' || rep.role === 'owner')
    .map(({ role, ...rest }) => rest);

    let ultimateBeneficialOwners: RainPersonDto[] = rainRepresentatives
      .filter((rep) => rep.role === 'beneficial-owner' || rep.role === 'owner')
      .map(({ role, ...rest }) => rest);

    console.log("representativesWithoutRole", representativesWithoutRole);
    console.log("ultimateBeneficialOwners", ultimateBeneficialOwners);

    // If there are no representatives, use the initial user as a representative
    if (representativesWithoutRole.length === 0) {
      representativesWithoutRole = [initialUser];
    }

    // If there are no ultimate beneficial owners, use the initial user as an UBO
    if (ultimateBeneficialOwners.length === 0) {
      ultimateBeneficialOwners = [initialUser];
    }

    // Construct the final RainMerchantCreateDto object
    const rainMerchantCreateDto: RainMerchantCreateDto = {
      initialUser,
      address: companyAddress,
      entity,
      name: company.name,
      representatives: representativesWithoutRole,
      ultimateBeneficialOwners,
    };
  
    return rainMerchantCreateDto;
  }