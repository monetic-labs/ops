// dtos/bridgeDtos.ts

import { ISO3166Alpha2Country, PersonRole } from "@backpack-fux/pylon-sdk";

export interface BridgeCompanyDto {
  name: string;
  email: string;
  registeredAddress: BridgeAddressDto;
}

export interface BridgeRepresentativeDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  //appRole: string;
  appRole: "owner" | "representative" | "beneficial-owner";
  bridgeUserRole?: PersonRole;
  walletAddress?: string;
}

export interface BridgeMerchantCreateDto {
  fee: number;
  walletAddress: string;
  company: BridgeCompanyDto;
  representatives: BridgeRepresentativeDto[];
  compliance?: {
    bridgeCustomerId: string;
    bridgeComplianceId: string;
  };
}

export interface BridgeAddressDto {
  street1: string;
  street2?: string;
  city: string;
  postcode: string;
  state?: string;
  country: ISO3166Alpha2Country;
}
