// mappers/bridgeMapper.ts

import {
    CompanyAccountSchema,
    CompanyDetailsSchema,
    CompanyAccountUsersSchema,
  } from '@/types/validations/onboard';
  import {
    BridgeCompanyDto,
    BridgeRepresentativeDto,
    BridgeMerchantCreateDto,
    BridgeUserRole,
  } from '@/types/dtos/bridgeDTO';
  
  export function mapToBridgeMerchantCreateDto(
    accountData: CompanyAccountSchema,
    detailsData: CompanyDetailsSchema,
    usersData: CompanyAccountUsersSchema
  ): BridgeMerchantCreateDto {
    
    const companyDto: BridgeCompanyDto = {
      name: accountData.company.name,
      email: accountData.company.email,
      registeredAddress: {
        street1: accountData.company.registeredAddress.street1,
        street2: accountData.company.registeredAddress.street2,
        city: accountData.company.registeredAddress.city,
        postcode: accountData.company.registeredAddress.postcode,
        state: accountData.company.registeredAddress.state,
        country: accountData.company.registeredAddress.country,
      },
    };
  
    const representativesDto: BridgeRepresentativeDto[] = usersData.representatives.map((rep) => ({
      firstName: rep.firstName,
      lastName: rep.lastName,
      email: rep.email,
      phoneNumber: rep.phoneNumber,
      appRole: rep.role,
      bridgeUserRole: rep.bridgeUserRole,
      walletAddress: rep.walletAddress,
    }));
  
    const merchantCreateDto: BridgeMerchantCreateDto = {
      fee: 0, // Set accordingly
      walletAddress: detailsData.walletAddress,
      company: companyDto,
      representatives: representativesDto,
      // Add compliance data if available
    };
  
    return merchantCreateDto;
  }