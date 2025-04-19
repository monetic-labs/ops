import type { LucideIcon } from "lucide-react";
import type { Address, Hex } from "viem";

import { PersonRole, StableCurrency } from "@monetic-labs/sdk";

export type PasskeyInfo = {
  credentialId: string;
  displayName: string;
  publicKey: Hex;
};

export type Signer = {
  address: Address;
  name: string;
  image: string;
  role?: PersonRole;
  isAccount: boolean;
  hasSigned?: boolean;
};

export type TransferActivity = {
  id: Hex;
  type: "sent" | "received";
  status: "pending" | "completed" | "failed";
  amount: number;
  timestamp: Date;
  from: {
    address: Address;
    name: string;
  };
  to: {
    address: Address;
    name: string;
  };
  signers: Signer[];
  requiredSignatures: number;
  currentSignatures: number;
};

export type Account = {
  id: string;
  address: Address;
  rainControllerAddress?: Address;
  name: string;
  currency: StableCurrency;
  balance: number;
  icon: LucideIcon;
  isDeployed: boolean;
  signers: Signer[];
  threshold: number;
  recentActivity: TransferActivity[];
  pendingActivity: TransferActivity[];
  isSettlement: boolean;
  isCard: boolean;
  isDisabled: boolean;
  isComingSoon: boolean;
  isCreateAccount: boolean;
};
