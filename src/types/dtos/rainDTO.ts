// dtos/rainDtos.ts

import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export type RainAddressDto = {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: ISO3166Alpha2Country;
    country: string;
}

export type RainPersonDto = {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    nationalId: string;
    countryOfIssue: ISO3166Alpha2Country;
    email: string;
    address: RainAddressDto;
}

export type RainInitialUserDto = RainPersonDto & {
    isTermsOfServiceAccepted: boolean;
    role?: string;
    walletAddress?: string;
    ipAddress: string;
    iovationBlackbox: string;
    country: string;
}

export type RainEntityDto = {
    name: string;
    type: string;
    description: string;
    taxId: string;
    website: string;
    expectedSpend: string;
}
  
export type RainMerchantCreateDto = {
    initialUser: RainInitialUserDto;
    address: RainAddressDto;
    entity: RainEntityDto;
    name: string;
    chainId: string;
    contractAddress: string;
    representatives: RainPersonDto[];
    ultimateBeneficialOwners: RainPersonDto[];
}
