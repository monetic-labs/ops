import React, { useEffect, useState } from "react";

import { Select, SelectItem } from "@nextui-org/select";
import { Network, StableCurrency } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

import { FormButton } from "../generics/form-button";

import GenerateApiKeysModal from "./actions/widgets/api-keys";
import { RefundSuccessModal } from "./actions/order-success";

import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";

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

export default function WidgetManagement() {
  const [settlementAddress, setSettlementAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<StableCurrency | null>(null);
  const [initialState, setInitialState] = useState<{
    settlementAddress: string;
    selectedNetwork: Network;
    selectedCurrency: StableCurrency;
  }>({
    settlementAddress: "",
    selectedNetwork: Network.BASE,
    selectedCurrency: StableCurrency.USDC,
  });

  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState({
    isOpen: false,
    title: "",
    message: "",
    fadeOutOpts: {
      autoFadeOut: true,
      fadeoutTime: 3000,
    },
  });

  useEffect(() => {
    const fetchSettlementAccount = async () => {
      const accountDetails = await pylon.getSettlementAccount();

      setSettlementAddress(accountDetails.walletAddress);
      setSelectedNetwork(accountDetails.network);
      setSelectedCurrency(accountDetails.currency);
      setInitialState({
        settlementAddress: accountDetails.walletAddress,
        selectedNetwork: accountDetails.network as Network,
        selectedCurrency: accountDetails.currency as StableCurrency,
      });
    };

    fetchSettlementAccount();
  }, []);

  const handleSaveSettings = async () => {
    if (!hasChanges()) return;

    const isSaved = await pylon.updateSettlementAccount({
      walletAddress: settlementAddress,
      network: selectedNetwork as Network,
      currency: selectedCurrency as StableCurrency,
    });

    setModalProps({
      isOpen: true,
      title: isSaved ? "Settlement account updated successfully" : "Failed to update settlement account",
      message: isSaved ? "Settlement account updated successfully" : "Failed to update settlement account",
      fadeOutOpts: {
        autoFadeOut: true,
        fadeoutTime: 3000,
      },
    });

    setInitialState({
      settlementAddress,
      selectedNetwork: selectedNetwork as Network,
      selectedCurrency: selectedCurrency as StableCurrency,
    });
  };

  const hasChanges = () => {
    return (
      settlementAddress !== initialState.settlementAddress ||
      selectedNetwork !== initialState.selectedNetwork ||
      selectedCurrency !== initialState.selectedCurrency
    );
  };

  return (
    <div className="space-y-4">
      <Autocomplete
        label="Settlement Account"
        placeholder="Search for an account"
        value={settlementAddress}
        onSelectionChange={(value) => {
          if (value !== null) setSettlementAddress(value.toString());
        }}
      >
        {accounts.map((account) => (
          <AutocompleteItem key={account.address} value={account.address} textValue={`${account.name} Account`}>
            {account.name} Account
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Select
        isDisabled
        label="Settlement Network"
        placeholder="Select a network"
        selectedKeys={selectedNetwork ? [selectedNetwork] : []}
        onSelectionChange={(keys) => setSelectedNetwork(Network.BASE)}
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
        selectedKeys={selectedCurrency ? [selectedCurrency] : []}
        onSelectionChange={(keys) => setSelectedCurrency(StableCurrency.USDC)}
      >
        {currencies.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </Select>
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        <FormButton className="w-full sm:w-auto" disabled={!hasChanges()} onClick={handleSaveSettings}>
          Save Settings
        </FormButton>
      </div>

      <GenerateApiKeysModal isOpen={isApiKeysModalOpen} onClose={() => setIsApiKeysModalOpen(false)} />
      <RefundSuccessModal
        fadeOutOpts={modalProps.fadeOutOpts}
        isOpen={modalProps.isOpen}
        message={modalProps.message}
        title={modalProps.title}
        onClose={() => setModalProps({ ...modalProps, isOpen: false })}
      />
    </div>
  );
}
