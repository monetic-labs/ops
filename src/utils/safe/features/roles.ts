import {
  Address,
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
  keccak256,
  toHex,
  concat,
  pad,
  Hex,
} from "viem";
import { MetaTransaction } from "abstractionkit";

import { ROLES_V3_ABI } from "@/utils/abi/rolesv3";
import { WebAuthnCredentials } from "@/types/webauthn";
import { executeSafeTransactions } from "../core/transactions";

export enum ExecutionOptions {
  None = 0,
  Send = 1,
  DelegateCall = 2,
  Both = 3,
}

export enum ParameterType {
  Static = 0,
  Dynamic = 1,
  Dynamic32 = 2,
}

export enum Operator {
  Equal = 0,
  GreaterThan = 1,
  LessThan = 2,
  GreaterThanOrEqual = 3,
  LessThanOrEqual = 4,
  NotEqual = 5,
}

export interface RoleCondition {
  parent: number;
  paramType: ParameterType;
  operator: Operator;
  compValue: Hex;
}

export interface RolePermission {
  type: "target" | "function" | "scopedFunction";
  targetAddress: Address;
  functionSignature?: string;
  conditions?: RoleCondition[];
  options: ExecutionOptions;
  allowance?: {
    amount: bigint;
    period: number;
  };
}

/**
 * Helper function to convert a string to bytes32
 */
function stringToBytes32(str: string): Hex {
  return keccak256(toHex(str));
}

/**
 * Helper function to get function selector from signature
 */
function getFunctionSelector(signature: string): Hex {
  return keccak256(toHex(signature)).slice(0, 10) as Hex;
}

/**
 * Creates a transaction to enable the Roles Modifier module on a Safe
 */
export function createEnableRolesModTransaction(rolesModAddress: Address): MetaTransaction {
  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "enableModule",
      args: [rolesModAddress],
    }),
    value: BigInt(0),
  };
}

/**
 * Creates a transaction to assign roles to an address
 */
export function createAssignRolesTransaction(
  rolesModAddress: Address,
  member: Address,
  roleKey: Hex,
  isEnabled: boolean
): MetaTransaction {
  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "assignRoles",
      args: [member, [roleKey], [isEnabled]],
    }),
    value: BigInt(0),
  };
}

/**
 * Creates a transaction to allow a role to access all functions on a target
 */
export function createAllowTargetTransaction(
  rolesModAddress: Address,
  roleKey: Hex,
  targetAddress: Address,
  options: ExecutionOptions
): MetaTransaction {
  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "allowTarget",
      args: [roleKey, targetAddress, options],
    }),
    value: BigInt(0),
  };
}

/**
 * Creates a transaction to allow a role to call a specific function
 */
export function createAllowFunctionTransaction(
  rolesModAddress: Address,
  roleKey: Hex,
  targetAddress: Address,
  functionSignature: string,
  options: ExecutionOptions
): MetaTransaction {
  const selector = getFunctionSelector(functionSignature);

  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "allowFunction",
      args: [roleKey, targetAddress, selector, options],
    }),
    value: BigInt(0),
  };
}

/**
 * Creates a transaction to scope a function with parameter conditions
 */
export function createScopeFunctionTransaction(
  rolesModAddress: Address,
  roleKey: Hex,
  targetAddress: Address,
  functionSignature: string,
  conditions: RoleCondition[],
  options: ExecutionOptions
): MetaTransaction {
  const selector = getFunctionSelector(functionSignature);

  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "scopeFunction",
      args: [roleKey, targetAddress, selector, conditions, options],
    }),
    value: BigInt(0),
  };
}

/**
 * Creates a transaction to set an allowance for a role
 */
export function createSetAllowanceTransaction(
  rolesModAddress: Address,
  roleKey: Hex,
  targetAddress: Address,
  functionSignature: string,
  amount: bigint,
  period: number = 86400 // 24 hours in seconds
): MetaTransaction {
  const selector = getFunctionSelector(functionSignature);
  const allowanceKey = keccak256(concat([roleKey, targetAddress, selector]));
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    to: rolesModAddress,
    data: encodeFunctionData({
      abi: ROLES_V3_ABI,
      functionName: "setAllowance",
      args: [allowanceKey, amount, amount, amount, BigInt(period), BigInt(timestamp)],
    }),
    value: BigInt(0),
  };
}

/**
 * Sets up a complete role with permissions
 */
export async function setupRole(
  safeAddress: Address,
  rolesModAddress: Address,
  roleLabel: string,
  member: Address,
  permissions: RolePermission[],
  credentials: WebAuthnCredentials
) {
  const roleKey = stringToBytes32(roleLabel);
  const transactions: MetaTransaction[] = [];

  // Add assignRoles transaction
  transactions.push(createAssignRolesTransaction(rolesModAddress, member, roleKey, true));

  // Add permission transactions
  for (const permission of permissions) {
    if (permission.type === "target") {
      transactions.push(
        createAllowTargetTransaction(rolesModAddress, roleKey, permission.targetAddress, permission.options)
      );
    } else if (permission.type === "function" && permission.functionSignature) {
      transactions.push(
        createAllowFunctionTransaction(
          rolesModAddress,
          roleKey,
          permission.targetAddress,
          permission.functionSignature,
          permission.options
        )
      );
    } else if (permission.type === "scopedFunction" && permission.functionSignature && permission.conditions) {
      transactions.push(
        createScopeFunctionTransaction(
          rolesModAddress,
          roleKey,
          permission.targetAddress,
          permission.functionSignature,
          permission.conditions,
          permission.options
        )
      );
    }

    // Add allowance if specified
    if (permission.allowance && permission.functionSignature) {
      transactions.push(
        createSetAllowanceTransaction(
          rolesModAddress,
          roleKey,
          permission.targetAddress,
          permission.functionSignature,
          permission.allowance.amount,
          permission.allowance.period
        )
      );
    }
  }

  // Execute all transactions
  return await executeSafeTransactions(safeAddress, transactions, credentials);
}
