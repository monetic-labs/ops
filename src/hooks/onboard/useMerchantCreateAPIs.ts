import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";
import { useRainCreateMerchant } from "@/hooks/merchant/useRainCreateMerchant";

export const useMerchantCreateAPIs = () => {
  const {
    createBridgeMerchant,
    isLoading: isCreatingMerchant,
    error: createMerchantError,
    data: createMerchantData,
  } = useCreateBridgeMerchant();

  const {
    createRainMerchant,
    isLoading: isCreatingRainMerchant,
    error: createRainMerchantError,
    data: createRainMerchantData,
  } = useRainCreateMerchant();

  return {
    createBridgeMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    createRainMerchant,
    isCreatingRainMerchant,
    createRainMerchantError,
    createRainMerchantData,
  };
};
