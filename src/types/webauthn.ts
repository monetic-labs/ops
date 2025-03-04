import { Address } from "viem";

export interface WebAuthnCredentials {
  publicKey: {
    x: bigint;
    y: bigint;
  };
  credentialId: string;
}

export interface OnboardingState {
  credentials: WebAuthnCredentials;
  walletAddress: Address;
  settlementAddress: Address;
}
