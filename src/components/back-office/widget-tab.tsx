import React, { useState } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { Network, StableCurrency } from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Spinner } from "@nextui-org/spinner";

import { capitalizeFirstChar } from "@/utils/helpers";

import GenerateApiKeysModal from "./actions/widgets/api-keys";
import { useAccountManagement } from "@/hooks/useAccountManagement";

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
  const { accounts, isLoadingAccounts } = useAccountManagement();
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Autocomplete
        label="Settlement Account"
        placeholder={isLoadingAccounts ? "Loading accounts..." : "Search for an account"}
        defaultSelectedKey={settlementAddress}
        selectedKey={settlementAddress}
        isDisabled={isLoadingAccounts || !accounts.length || accounts.length === 1}
        defaultItems={accounts}
        isLoading={isLoadingAccounts}
        onSelectionChange={(key) => {
          if (key) onSettlementAddressChange(key.toString());
        }}
      >
        {(account) => (
          <AutocompleteItem
            key={account.address}
            textValue={`${account.name} Account`}
            value={account.address}
            className="capitalize"
          >
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
          <SelectItem key={network} value={network}>
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
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </Select>

      <GenerateApiKeysModal isOpen={isApiKeysModalOpen} onClose={() => setIsApiKeysModalOpen(false)} />
    </div>
  );
}
