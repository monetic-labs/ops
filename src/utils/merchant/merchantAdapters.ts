import { v4 as uuidv4 } from 'uuid';

import { 
    Address,
    MerchantData, 
    BridgeMerchantData, 
    RainMerchantData, 
    BridgeAddress, 
    RainAddress, 
    BridgeUser, 
    RainUser, 
    RainInitialUser, 
    RainEntity, 
    Representative,
    UserDetail
  } from '@/types/merchant';
  import { merchantConfig } from '@/config/merchant';
  
  // Helper function to adapt address for Bridge
  function adaptToBridgeAddress(address: Address): BridgeAddress {
    return {
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      country: address.country,
    };
  }
  
  // Helper function to adapt address for Rain
  function adaptToRainAddress(address: Address): RainAddress {
    return {
      line1: address.street1,
      line2: address.street2,
      city: address.city,
      region: address.state,
      postalCode: address.postcode,
      countryCode: address.country,
      country: address.country, 
    };
  }
  
  function adaptToBridgeUser(rep: Representative, userDetail: UserDetail): BridgeUser {
    return {
        firstName: rep.firstName,
        lastName: rep.lastName,
        email: rep.email,
        phoneNumber: rep.phoneNumber,
        role: rep.role,
        walletAddress: undefined, 
    };
}
  
function adaptToRainUser(rep: Representative, userDetail: UserDetail, type: "representative" | "ultimateBeneficialOwner"): RainUser & { type: "representative" | "ultimateBeneficialOwner" } {
    return {
        id: uuidv4(),
        type,
        firstName: rep.firstName,
        lastName: rep.lastName,
        email: rep.email,
        birthDate: userDetail.birthday,
        countryOfIssue: userDetail.countryOfIssue,
        nationalId: userDetail.ssn,
        address: adaptToRainAddress(userDetail.registeredAddress),
    };
}

function adaptToBridgeCompany(data: MerchantData['companyAccount']['company']): Company {
    return {
        name: data.name,
        email: data.email,
        website: data.website,
        registeredAddress: adaptToBridgeAddress(data.registeredAddress),
    };
}
  
export function adaptToBridgeData(data: MerchantData): BridgeMerchantData {
    return {
        fee: merchantConfig.fee,
        walletAddress: data.companyDetails.walletAddress,
        company: adaptToBridgeCompany(data.companyAccount.company),
        representatives: data.accountUsers.representatives.map((rep, index) => 
            adaptToBridgeUser(rep, data.userDetails[index])
        ),
    };
}  

export function adaptToRainData(data: MerchantData): RainMerchantData {
    const initialUser: RainInitialUser = {
        id: uuidv4(),
        firstName: data.accountUsers.representatives[0].firstName,
        lastName: data.accountUsers.representatives[0].lastName,
        email: data.accountUsers.representatives[0].email,
        birthDate: data.userDetails[0].birthday,
        nationalId: data.userDetails[0].ssn,
        countryOfIssue: data.userDetails[0].countryOfIssue,
        address: adaptToRainAddress(data.userDetails[0].registeredAddress),
        role: merchantConfig.role,
        walletAddress: data.companyDetails.walletAddress,
        ipAddress: merchantConfig.ipAddress,
        iovationBlackbox: merchantConfig.iovation,
        isTermsOfServiceAccepted: true, // You might need to track this separately
    };

    const entity: RainEntity = {
        name: data.companyAccount.company.name,
        type: data.companyDetails.companyType,
        description: data.companyDetails.companyDescription,
        website: data.companyAccount.company.website,
        taxId: data.companyDetails.companyEIN,
    };

    const representatives: (RainUser & { type: "representative" })[] = data.accountUsers.representatives.map((rep, index) => 
        adaptToRainUser(rep, data.userDetails[index], "representative") as RainUser & { type: "representative" }
    );

    return {
        name: data.companyAccount.company.name,
        initialUser,
        entity,
        representatives,
        ultimateBeneficialOwners: [],
        chainId: "", 
        contractAddress: "",
    };
}