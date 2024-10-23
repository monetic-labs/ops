import React, { useEffect, useState } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { FormButton } from "../generics/form-button";
import GenerateApiKeysModal from "./actions/widgets/api-keys";
import pylon from "@/libs/pylon-sdk";
import { Network, StableCurrency } from "@backpack-fux/pylon-sdk";
import { RefundSuccessModal } from "./actions/order-success";

const networks = ["POLYGON", "SOLANA", "BASE", "OPTIMISM", "ARBITRUM"];
const currencies = ["USDC", "USDT", "DAI"];

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
      <Input
        label="Settlement Address"
        placeholder="Enter wallet address"
        value={settlementAddress}
        onChange={(e) => setSettlementAddress(e.target.value)}
      />
      <Select
        label="Settlement Network"
        placeholder="Select a network"
        selectedKeys={selectedNetwork ? [selectedNetwork] : []}
        onSelectionChange={(keys) => setSelectedNetwork(Array.from(keys)[0] as Network)}
      >
        {networks.map((network) => (
          <SelectItem key={network} value={network}>
            {network.charAt(0).toUpperCase() + network.slice(1).toLowerCase()}
          </SelectItem>
        ))}
      </Select>
      <Select
        label="Settlement Currency"
        placeholder="Select a currency"
        selectedKeys={selectedCurrency ? [selectedCurrency] : []}
        onSelectionChange={(keys) => setSelectedCurrency(Array.from(keys)[0] as StableCurrency)}
      >
        {currencies.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </Select>
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        <FormButton onClick={handleSaveSettings} className="w-full sm:w-auto" disabled={!hasChanges()}>
          Save Settings
        </FormButton>
        <FormButton onClick={() => setIsApiKeysModalOpen(true)} className="w-full sm:w-auto">
          Manage API Keys
        </FormButton>
      </div>

      <GenerateApiKeysModal isOpen={isApiKeysModalOpen} onClose={() => setIsApiKeysModalOpen(false)} />
      <RefundSuccessModal
        isOpen={modalProps.isOpen}
        onClose={() => setModalProps({ ...modalProps, isOpen: false })}
        title={modalProps.title}
        message={modalProps.message}
        fadeOutOpts={modalProps.fadeOutOpts}
      />
    </div>
  );
}
