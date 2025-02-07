import React, { useEffect, useState } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { Network, StableCurrency } from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";

import pylon from "@/libs/pylon-sdk";

import GenerateApiKeysModal from "./actions/widgets/api-keys";
import { RefundSuccessModal } from "./actions/order-success";

const networks = ["POLYGON", "SOLANA", "BASE", "OPTIMISM", "ARBITRUM"];
const currencies = ["USDC", "USDT", "DAI"];

// TODO: Fetch accounts from backend
const accounts = [
  {
    name: "Settlement",
    address: "0x595ec62736Bf19445d7F00D66072B3a3c7aeA0F5",
  },
  {
    name: "Rain",
    address: "0x695ec62736Bf19445d7F00D66072B3a3c7aeA0F5",
  },
];

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
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Autocomplete
        label="Settlement Account"
        placeholder="Search for an account"
        value={settlementAddress}
        onSelectionChange={(value) => {
          if (value !== null) onSettlementAddressChange(value.toString());
        }}
      >
        {accounts.map((account) => (
          <AutocompleteItem key={account.address} textValue={`${account.name} Account`} value={account.address}>
            {account.name} Account
          </AutocompleteItem>
        ))}
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
            {network.charAt(0).toUpperCase() + network.slice(1).toLowerCase()}
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
