import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

/* Backpack Merchant Types */
export type Address = {
    postcode: string;
    city: string;
    state: string;
    country: ISO3166Alpha2Country;
    street1: string;
    street2?: string;
}

export type Representative = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
}

export type UserDetail = {
    countryOfIssue: ISO3166Alpha2Country;
    birthday: string;
    ssn: string;
    registeredAddress: Address;
}

export type MerchantData = {
    companyAccount: {
        company: {
            name: string;
            email: string;
            registeredAddress: Address;
            website: string;
        };
    };
    companyDetails: {
        walletAddress: string;
        companyEIN: string;
        companyType: string;
        companyDescription: string;
    };
    accountUsers: {
        representatives: Representative[];
    };
    userDetails: UserDetail[];
}

/* Pylon SDK Types: Bridge Create Merchant */
export type BridgeMerchantData = {
    fee: number;
    walletAddress: string;
    company: BridgeEntity;
    representatives: BridgeUser[];
}

export type BridgeAddress = {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postcode: string;
    country: ISO3166Alpha2Country;
}

export type BridgeUser = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role?: string;
    walletAddress?: string;
}

export type BridgeEntity = {
    name: string;
    email: string;
    address: BridgeAddress;
}
  
/* Pylon SDK Types: Rain Create Merchant */
export type RainMerchantData = {
    name: string;
    initialUser: RainInitialUser;
    entity: RainEntity;
    representatives: Array<RainUser & { type: "representative" }>;
    ultimateBeneficialOwners: Array<RainUser & { type: "ultimateBeneficialOwner" }>;
    chainId: string;
    contractAddress: string;
}

export type RainAddress = {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: ISO3166Alpha2Country;
    country: string;
}

export type RainUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    countryOfIssue: ISO3166Alpha2Country;
    nationalId: string;
    address: RainAddress;
}

export type RainInitialUser = RainUser & {
    id: string;
    role: string;
    isTermsOfServiceAccepted: boolean;
    walletAddress?: string;
    iovationBlackbox?: string;
    ipAddress?: string;
}

export type RainEntity = {
    name: string;
    type: string;
    description: string;
    website: string;
    taxId: string;
    expectedSpend?: number;
}