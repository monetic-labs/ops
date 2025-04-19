"use client";

// Import the component previously used for the 'Widget' tab in Back Office
import WidgetTab from "@/components/back-office/widget-tab";
import { useAccounts } from "@/contexts/AccountContext"; // Import context to get account details
import { Network, StableCurrency } from "@monetic-labs/sdk"; // Import necessary types
import { Address } from "viem";
import { useState } from "react"; // Import useState if needed for handlers

export default function BackOfficeWidgetPage() {
  const { selectedAccount } = useAccounts();

  // Provide necessary props, potentially from context or state
  // Using selectedAccount for address/currency/network - adjust if source differs
  const settlementAddress = selectedAccount?.address;
  const selectedNetwork = Network.BASE; // Assuming BASE, adjust if dynamic
  const selectedCurrency = selectedAccount?.currency || StableCurrency.USDC; // Default if needed

  // Placeholder handlers - implement actual logic if required by WidgetTab
  const handleSettlementAddressChange = (address: string) => {
    console.log("Settlement Address Change:", address);
  };
  const handleSelectedNetworkChange = (network: Network) => {
    console.log("Network Change:", network);
  };
  const handleSelectedCurrencyChange = (currency: StableCurrency) => {
    console.log("Currency Change:", currency);
  };
  const handleApiKeyChange = (key: string) => {
    console.log("API Key Change:", key);
  };

  // Ensure required props are passed, handle potential undefined values
  if (!settlementAddress) {
    // Handle case where settlement address is missing, e.g., show loading or error
    return <div>Loading account details...</div>;
  }

  return (
    <WidgetTab
      settlementAddress={settlementAddress}
      selectedNetwork={selectedNetwork}
      selectedCurrency={selectedCurrency}
      onSettlementAddressChange={handleSettlementAddressChange}
      onNetworkChange={handleSelectedNetworkChange}
      onCurrencyChange={handleSelectedCurrencyChange}
      hasChanges={false}
    />
  );
}
