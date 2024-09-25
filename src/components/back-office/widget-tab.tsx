import React, { useState } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { FormButton } from "../generics/form-button";
import GenerateApiKeysModal from "./actions/widgets/api-keys";

const networks = ["polygon", "solana", "base", "optimism", "arbitrum"];
const currencies = ["USDC", "USDT", "DAI", "GLO"];

export default function WidgetManagement() {
  const [settlementAddress, setSettlementAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  const handleSaveSettings = () => {
    console.log("Saving settings:", {
      settlementAddress,
      selectedNetwork,
      selectedCurrency,
    });
    // Implement save logic here
  };

  return (
    <div className="space-y-4">
      <Input
        label="Settlement Address"
        placeholder="Enter settlement address"
        value={settlementAddress}
        onChange={(e) => setSettlementAddress(e.target.value)}
      />
      <Select
        label="Settlement Network"
        placeholder="Select a network"
        selectedKeys={selectedNetwork ? [selectedNetwork] : []}
        onSelectionChange={(keys) => setSelectedNetwork(Array.from(keys)[0] as string)}
      >
        {networks.map((network) => (
          <SelectItem key={network} value={network}>
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </SelectItem>
        ))}
      </Select>
      <Select
        label="Settlement Currency"
        placeholder="Select a currency"
        selectedKeys={selectedCurrency ? [selectedCurrency] : []}
        onSelectionChange={(keys) => setSelectedCurrency(Array.from(keys)[0] as string)}
      >
        {currencies.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </Select>
      <FormButton onClick={handleSaveSettings}>Save Settings</FormButton>
      <FormButton onClick={() => setIsApiKeysModalOpen(true)}>Manage API Keys</FormButton>

      <GenerateApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
      />
    </div>
  );
}
