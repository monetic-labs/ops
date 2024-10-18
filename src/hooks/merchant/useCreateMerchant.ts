import { useState } from "react";
import { MerchantCreateInput, MerchantCreateOutput, PersonRole } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";
import { BridgeMerchantCreateDto, BridgeUserRole } from "@/types/dtos/bridgeDTO";

function mapBridgeUserRoleToPersonRole(bridgeUserRole: BridgeUserRole | undefined): PersonRole | undefined {
  if (bridgeUserRole === undefined) return undefined;

  switch (bridgeUserRole) {
    case BridgeUserRole.SUPER_ADMIN:
      return "SUPER_ADMIN";
    case BridgeUserRole.ADMIN:
      return "ADMIN";
    case BridgeUserRole.BOOKKEEPER:
      return "BOOKKEEPER";
    case BridgeUserRole.DEVELOPER:
      return "DEVELOPER";
    case BridgeUserRole.MEMBER:
      return "MEMBER";
    default:
      return "MEMBER";
  }
}

export function useCreateBridgeMerchant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantCreateOutput | null>(null);

  const createBridgeMerchant = async (
    data: BridgeMerchantCreateDto
  ): Promise<{ success: boolean; data: MerchantCreateOutput | null; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    setData(null);
    
    try {
      // Map BridgeMerchantCreateDto to MerchantCreateInput
      const createBridgeMerchant: MerchantCreateInput = {
        ...data,
        representatives: data.representatives.map(rep => {
          const { appRole, bridgeUserRole, ...rest } = rep;
          return {
            ...rest,
            role: mapBridgeUserRoleToPersonRole(bridgeUserRole)
          };
        })
      };

      console.log("useCreateMerchant:", createBridgeMerchant);
      const response = await pylon.createMerchant(createBridgeMerchant);

      console.log("useCreateMerchant response:", response);

      if (response && response.statusCode === 200) {
        setData(response);
        setIsLoading(false);

        return { success: true, data: response, error: null };
      } else {
        setError("Merchant creation failed");
        setIsLoading(false);

        return { success: false, data: null, error: "Merchant creation failed" };
      }
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      setError(errorMessage);
      console.log("useCreateMerchant error:", errorMessage);

      return { success: false, data: null, error: errorMessage };
    }
  };

  return { createBridgeMerchant: createBridgeMerchant, isLoading, error, data };
}
