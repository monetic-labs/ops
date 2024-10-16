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
      ipAddress: string;
      iovationBlackbox: string;
      chainId: string;
      expectedSpend: string;
      //country: string;
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
        //role: rep.role,
      };
    });
  
    // Map the initial user (first representative)
    const initialUser: RainInitialUserDto = {
      ...rainRepresentatives[0], // Use the first representative's data
      isTermsOfServiceAccepted: additionalData.isTermsOfServiceAccepted,
      role: representatives[0].role,
      walletAddress: walletAddress,
      //country: additionalData.country,
    };

    const ultimateBeneficialOwners: RainPersonDto[] = rainRepresentatives
    .filter((rep) => rep.role === 'beneficial-owner')
    .map(({ role, ...rest }) => rest); // Exclude 'role' from the final DTOs
  
    const representativesWithoutRole: RainPersonDto[] = rainRepresentatives.map(({ role, ...rest }) => rest);
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