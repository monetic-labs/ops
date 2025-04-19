import React, { useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Network, StableCurrency } from "@monetic-labs/sdk";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import { capitalizeFirstChar } from "@/utils/helpers";
import { useAccounts } from "@/contexts/AccountContext";

import GenerateApiKeysModal from "./actions/widgets/api-keys";

const networks = ["POLYGON", "SOLANA", "BASE", "OPTIMISM", "ARBITRUM"];
const currencies = ["USDC", "USDT", "DAI"];

interface WidgetManagementProps {
  settlementAddress: string;
  selectedNetwork: Network;
  selectedCurrency: StableCurrency;
  onSettlementAddressChange: (address: string) => void;
  onNetworkChange: (network: Network) => void;
  onCurrencyChange: (currency: StableCurrency) => void;
  hasChanges: boolean;
}

export default function WidgetManagement({
  settlementAddress,
  selectedNetwork,
  selectedCurrency,
  onSettlementAddressChange,
  onNetworkChange,
  onCurrencyChange,
  hasChanges,
}: WidgetManagementProps) {
  const { getEnabledAccounts, isLoadingAccounts } = useAccounts();
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  const enabledAccounts = getEnabledAccounts();

  return (
    <div className="space-y-4">
      <Autocomplete
        defaultItems={enabledAccounts}
        defaultSelectedKey={settlementAddress}
        isDisabled={isLoadingAccounts || !enabledAccounts.length || enabledAccounts.length === 1}
        isLoading={isLoadingAccounts}
        label="Settlement Account"
        placeholder={isLoadingAccounts ? "Loading accounts..." : "Search for an account"}
        selectedKey={settlementAddress}
        onSelectionChange={(key) => {
          if (key) onSettlementAddressChange(key.toString());
        }}
      >
        {(account) => (
          <AutocompleteItem key={account.address} className="capitalize" textValue={`${account.name} Account`}>
            <div className="flex items-center gap-2">
              <account.icon className="w-4 h-4" />
              <div className="flex flex-col">
                <span>{account.name} Account</span>
                <span className="text-tiny text-default-400">
                  Balance: ${account.balance?.toLocaleString() ?? "0.00"}
                </span>
              </div>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
      <Select
        isDisabled
        label="Settlement Network"
        placeholder="Select a network"
        selectedKeys={[selectedNetwork]}
        onSelectionChange={(keys) => onNetworkChange(Network.BASE)}
      >
        {networks.map((network) => (
          <SelectItem key={network} textValue={capitalizeFirstChar(network)}>
            {capitalizeFirstChar(network)}
          </SelectItem>
        ))}
      </Select>
      <Select
        isDisabled
        label="Settlement Currency"
        placeholder="Select a currency"
        selectedKeys={[selectedCurrency]}
        onSelectionChange={(keys) => onCurrencyChange(StableCurrency.USDC)}
      >
        {currencies.map((currency) => (
          <SelectItem key={currency} textValue={currency}>
            {currency}
          </SelectItem>
        ))}
      </Select>

      <GenerateApiKeysModal isOpen={isApiKeysModalOpen} onClose={() => setIsApiKeysModalOpen(false)} />
    </div>
  );
}
