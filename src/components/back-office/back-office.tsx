import { useState, useRef, useEffect } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { PlusIcon, SaveIcon } from "lucide-react";
import { Network, StableCurrency } from "@backpack-fux/pylon-sdk";

import { backOfficeConfig } from "@/config/tabs";
import { ResponsiveButton } from "@/components/generics/responsive-button";
import pylon from "@/libs/pylon-sdk";

import CreateOrderModal from "./actions/order-create";
import PaymentsTab from "./payments-tab";
import OrdersTab, { OrdersTabRef } from "./orders-tab";
import WidgetTab from "./widget-tab";

type BackOfficeTabsProps = {
  handleSubTabChange: (key: string) => void;
};

export default function BackOfficeTabs({ handleSubTabChange }: BackOfficeTabsProps) {
  const [selectedService, setSelectedService] = useState<string>(backOfficeConfig[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const ordersTabRef = useRef<OrdersTabRef>(null);

  // Settlement account state
  const [settlementAddress, setSettlementAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(Network.BASE);
  const [selectedCurrency, setSelectedCurrency] = useState<StableCurrency>(StableCurrency.USDC);
  const [initialState, setInitialState] = useState({
    settlementAddress: "",
    selectedNetwork: Network.BASE,
    selectedCurrency: StableCurrency.USDC,
  });

  useEffect(() => {
    const fetchSettlementAccount = async () => {
      const accountDetails = await pylon.getSettlementAccount();
      setSettlementAddress(accountDetails.walletAddress);
      setSelectedNetwork(accountDetails.network);
      setSelectedCurrency(accountDetails.currency);
      setInitialState({
        settlementAddress: accountDetails.walletAddress,
        selectedNetwork: accountDetails.network,
        selectedCurrency: accountDetails.currency,
      });
    };

    if (selectedService === "widget-management") {
      fetchSettlementAccount();
    }
  }, [selectedService]);

  const hasSettingsChanges = () => {
    return (
      settlementAddress !== initialState.settlementAddress ||
      selectedNetwork !== initialState.selectedNetwork ||
      selectedCurrency !== initialState.selectedCurrency
    );
  };

  const handleSaveSettings = async () => {
    if (!hasSettingsChanges()) return;

    const isSaved = await pylon.updateSettlementAccount({
      walletAddress: settlementAddress,
      network: selectedNetwork,
      currency: selectedCurrency,
    });

    if (isSaved) {
      setInitialState({
        settlementAddress,
        selectedNetwork,
        selectedCurrency,
      });
    }
  };

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "payments":
        return <PaymentsTab />;
      case "order-links":
        return <OrdersTab ref={ordersTabRef} />;
      case "widget-management":
        return (
          <WidgetTab
            settlementAddress={settlementAddress}
            selectedNetwork={selectedNetwork}
            selectedCurrency={selectedCurrency}
            onSettlementAddressChange={setSettlementAddress}
            onNetworkChange={setSelectedNetwork}
            onCurrencyChange={setSelectedCurrency}
            hasChanges={hasSettingsChanges()}
          />
        );
      default:
        return <div>Tab content not found</div>;
    }
  };

  const handleOrderCreated = async () => {
    setIsCreateModalOpen(false);
    if (ordersTabRef.current) {
      await ordersTabRef.current.refresh();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Tabs
            aria-label="Service options"
            selectedKey={selectedService}
            variant="bordered"
            onSelectionChange={(key) => setSelectedService(key as string)}
          >
            {backOfficeConfig.map((tab) => (
              <Tab key={tab.id} title={tab.label} />
            ))}
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          {selectedService === "widget-management" && (
            <ResponsiveButton
              label="Save Settings"
              icon={SaveIcon}
              type="primary"
              onPress={handleSaveSettings}
              isDisabled={!hasSettingsChanges}
            />
          )}
          {selectedService === "order-links" && (
            <ResponsiveButton label="Create Order Link" icon={PlusIcon} onPress={() => setIsCreateModalOpen(true)} />
          )}
        </div>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleOrderCreated}
      />
    </div>
  );
}
