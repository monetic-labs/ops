"use client";

import { Address } from "viem";
import { Network, StableCurrency } from "@monetic-labs/sdk";

import WidgetTab from "./_components/widget-tab";
import { useAccounts } from "@/contexts/AccountContext";
import { Skeleton } from "@heroui/skeleton"; // Import Skeleton

export default function CardSettlementSettingsPage() {
  // Fetch account details needed for the WidgetTab
  const { selectedAccount, isLoadingAccounts, getSettlementAccount } = useAccounts();

  // Attempt to get the actual settlement account, fall back to selected if needed
  const settlementAccount = getSettlementAccount() || selectedAccount;

  // Props required for WidgetTab
  const settlementAddress = settlementAccount?.address;
  const selectedNetwork = Network.BASE; // Assuming BASE, adjust if dynamic
  const selectedCurrency = settlementAccount?.currency || StableCurrency.USDC;

  // Placeholder handlers - implement actual logic if required by WidgetTab elsewhere
  // Consider lifting state up or using a settings context if these need to persist
  const handleSettlementAddressChange = (address: string) => {
    console.log("Settlement Address Change:", address);
    // TODO: Add mutation/API call to update virtual account destination
  };
  const handleSelectedNetworkChange = (network: Network) => {
    console.log("Network Change:", network);
  };
  const handleSelectedCurrencyChange = (currency: StableCurrency) => {
    console.log("Currency Change:", currency);
  };

  // Skeleton Loader for Widget Settings
  const WidgetSettingsSkeleton = () => (
    <div className="space-y-4 max-w-md">
      {" "}
      {/* Constrain width similar to WidgetTab */}
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Title is handled by the layout */}
      {/* <h2 className="text-xl font-semibold text-foreground mb-4">Card Settlement Settings</h2> */}
      <p className="text-sm text-foreground/70 mb-6 max-w-xl">
        Configure the destination account for funds received from card payments made via the Monetic widget or payment
        links. This ensures funds are routed correctly to your preferred operational account.
      </p>
      {isLoadingAccounts ? (
        <WidgetSettingsSkeleton />
      ) : settlementAddress ? (
        <WidgetTab
          settlementAddress={settlementAddress}
          selectedNetwork={selectedNetwork}
          selectedCurrency={selectedCurrency}
          onSettlementAddressChange={handleSettlementAddressChange}
          onNetworkChange={handleSelectedNetworkChange}
          onCurrencyChange={handleSelectedCurrencyChange}
          hasChanges={false} // Assuming no changes initially
        />
      ) : (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-warning-600 text-sm max-w-xl">
          Error: Could not load account details. Please ensure you have accounts set up to configure settlement.
        </div>
      )}
    </div>
  );
}
