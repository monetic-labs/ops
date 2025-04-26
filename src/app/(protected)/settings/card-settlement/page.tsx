"use client";

import { Address } from "viem";
import { Network, StableCurrency, MerchantAccountGetOutput } from "@monetic-labs/sdk";
import { useState, useEffect, useMemo } from "react";
import pylon from "@/libs/monetic-sdk"; // Import Pylon SDK

import SettlementAccountForm from "./_components/SettlementAccountForm";
import { useAccounts } from "@/contexts/AccountContext";
import { Skeleton } from "@heroui/skeleton";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { useToast } from "@/hooks/generics/useToast";

export default function CardSettlementSettingsPage() {
  const { isLoadingAccounts } = useAccounts(); // Keep this for Autocomplete loading state
  const { toast } = useToast();

  // State for the fetched settlement configuration
  const [currentSettlementConfig, setCurrentSettlementConfig] = useState<MerchantAccountGetOutput | null>(null);
  const [initialSettlementConfig, setInitialSettlementConfig] = useState<MerchantAccountGetOutput | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch settlement configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      setFetchError(null);
      try {
        const config = await pylon.getSettlementAccount();
        if (config) {
          setCurrentSettlementConfig(config);
          setInitialSettlementConfig(config);
        } else {
          // Handle case where no settlement account is configured yet
          // You might want a different UI state for this
          setFetchError("No settlement account configured yet.");
        }
      } catch (error) {
        console.error("Failed to fetch settlement config:", error);
        setFetchError("Failed to load settlement configuration.");
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Calculate if changes exist based on ledgerAddress
  const hasChanges = useMemo(() => {
    if (!currentSettlementConfig || !initialSettlementConfig) return false;
    return currentSettlementConfig.ledgerAddress !== initialSettlementConfig.ledgerAddress;
  }, [currentSettlementConfig, initialSettlementConfig]);

  // Handlers
  const handleSettlementAddressChange = (address: string) => {
    // Update the ledgerAddress within the current config state
    setCurrentSettlementConfig((prevConfig) => {
      if (!prevConfig) return null;
      return { ...prevConfig, ledgerAddress: address as Address }; // Cast to Address
    });
  };

  const handleSelectedNetworkChange = (network: Network) => {
    // Update network if needed in the future, ensure it updates currentSettlementConfig
    console.log("Network Change (disabled):", network);
  };

  const handleSelectedCurrencyChange = (currency: StableCurrency) => {
    // Update currency if needed in the future, ensure it updates currentSettlementConfig
    console.log("Currency Change (disabled):", currency);
  };

  const handleSave = async () => {
    if (
      !hasChanges ||
      !currentSettlementConfig ||
      !currentSettlementConfig.id ||
      !currentSettlementConfig.ledgerAddress
    ) {
      console.warn("Save aborted: No changes, missing config, ID, or ledger address.");
      return;
    }
    setIsSaving(true);
    console.log(
      `Saving settlement config ID: ${currentSettlementConfig.id}, New Address: ${currentSettlementConfig.ledgerAddress}`
    );
    try {
      // Call setSettlementAccount with only the ID
      const success = await pylon.setSettlementAccount(currentSettlementConfig.id);

      if (success) {
        toast({ title: "Success", description: "Settlement account updated." });
        // Update initial state to match current state to reset hasChanges
        setInitialSettlementConfig(currentSettlementConfig);
      } else {
        // Handle case where SDK returns false for failure
        throw new Error("SDK indicated save operation failed.");
      }
    } catch (error) {
      console.error("Failed to save settlement settings:", error);
      toast({ title: "Save Failed", description: "Could not update settlement account.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Skeleton Loader - update width
  const SettlementConfigSkeleton = () => (
    <Card shadow="none" classNames={{ base: "border border-divider max-w-4xl" }}>
      <CardHeader className="flex flex-col items-start gap-1.5">
        <Skeleton className="h-6 w-48 rounded-md mb-2" />
        <Skeleton className="h-4 w-full max-w-lg rounded-md" />
      </CardHeader>
      <CardBody className="space-y-4 pt-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </CardBody>
    </Card>
  );

  const pageTitle = "Card Settlement Settings";
  const pageDescription =
    "Configure the destination account for funds received from card payments made via the Monetic widget or payment links. This ensures funds are routed correctly to your preferred operational account.";

  // Handle Loading and Error States First
  if (isLoadingConfig) {
    return <SettlementConfigSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger-700 text-sm max-w-xl">
        {fetchError}
      </div>
    );
  }

  // Check if config exists *after* loading and error checks
  if (!currentSettlementConfig) {
    // This case might occur if fetch succeeded but returned null/undefined unexpectedly,
    // or if the initial fetchError state for "No settlement account configured yet" should lead here.
    return (
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-warning-600 text-sm max-w-xl">
        Settlement account configuration is not available. Please contact support or try again later.
      </div>
    );
  }

  // Render form if config is loaded successfully
  return (
    <div className="space-y-4">
      <SettlementAccountForm
        title={pageTitle}
        description={pageDescription}
        // Pass the currently selected ledger address
        settlementAddress={currentSettlementConfig.ledgerAddress || ""}
        // Pass the initial ledger address for comparison
        initialSettlementAddress={initialSettlementConfig?.ledgerAddress}
        // Network and Currency are read-only for now, taken from config
        selectedNetwork={currentSettlementConfig.network || Network.BASE}
        selectedCurrency={currentSettlementConfig.currency || StableCurrency.USDC}
        // Handlers
        onSettlementAddressChange={handleSettlementAddressChange}
        onNetworkChange={handleSelectedNetworkChange}
        onCurrencyChange={handleSelectedCurrencyChange}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
