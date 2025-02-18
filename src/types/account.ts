import { PersonRole } from "@backpack-fux/pylon-sdk";
import type { LucideIcon } from "lucide-react";
import type { Address, Hex } from "viem";

export type Operator = {
  address: Address;
  name: string;
  image: string;
  role?: PersonRole;
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
  operators: Operator[];
  requiredSignatures: number;
  currentSignatures: number;
};

export type Account = {
  address: Address;
  name: string;
  balance: number;
  currency: string;
  icon: LucideIcon;
  isEnabled: boolean;
  operators: Operator[];
  threshold: number;
  recentActivity: TransferActivity[];
  pendingActivity: TransferActivity[];
  isDisabled: boolean;
  isComingSoon: boolean;
  isCreateAccount: boolean;
};
