import React, { useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Network, StableCurrency } from "@monetic-labs/sdk";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";

import { capitalizeFirstChar } from "@/utils/helpers";
import { useAccounts } from "@/contexts/AccountContext";

// Removed GenerateApiKeysModal import as it seemed unused here

const networks = ["POLYGON", "SOLANA", "BASE", "OPTIMISM", "ARBITRUM"];
const currencies = ["USDC", "USDT", "DAI"];

interface SettlementAccountFormProps {
  title: string;
  description: string;
  settlementAddress: string;
  initialSettlementAddress: string | undefined;
  selectedNetwork: Network;
  selectedCurrency: StableCurrency;
  onSettlementAddressChange: (address: string) => void;
  onNetworkChange: (network: Network) => void;
  onCurrencyChange: (currency: StableCurrency) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function SettlementAccountForm({
  title,
  description,
  settlementAddress,
  initialSettlementAddress,
  selectedNetwork,
  selectedCurrency,
  onSettlementAddressChange,
  onNetworkChange,
  onCurrencyChange,
  onSave,
  isSaving,
}: SettlementAccountFormProps) {
  const { getEnabledAccounts, isLoadingAccounts } = useAccounts();

  const enabledAccounts = getEnabledAccounts();

  const hasChanges = settlementAddress !== initialSettlementAddress;

  return (
    <Card shadow="none" classNames={{ base: "border border-divider max-w-4xl" }}>
      <CardHeader className="flex flex-col items-start gap-1.5">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-foreground/70">{description}</p>
      </CardHeader>
      <CardBody className="space-y-4 pt-2">
        <Autocomplete
          defaultItems={enabledAccounts}
          isDisabled={isLoadingAccounts || !enabledAccounts.length || enabledAccounts.length === 1}
          isLoading={isLoadingAccounts}
          label="Settlement Account"
          placeholder={isLoadingAccounts ? "Loading accounts..." : "Select an account"}
          selectedKey={settlementAddress}
          onSelectionChange={(key) => {
            if (key) onSettlementAddressChange(key.toString());
          }}
          variant="bordered"
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
          variant="bordered"
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
          variant="bordered"
        >
          {currencies.map((currency) => (
            <SelectItem key={currency} textValue={currency}>
              {currency}
            </SelectItem>
          ))}
        </Select>
      </CardBody>
      {hasChanges && (
        <CardFooter className="border-t border-divider pt-4 flex justify-end">
          <Button color="primary" onPress={onSave} isLoading={isSaving} isDisabled={isSaving || !hasChanges}>
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
