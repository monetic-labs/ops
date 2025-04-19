import { useState, useRef, useEffect } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { PlusIcon, SaveIcon } from "lucide-react";
import { Network, StableCurrency, MerchantAccountGetOutput } from "@monetic-labs/sdk";

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
  const [settlementAccount, setSettlementAccount] = useState<MerchantAccountGetOutput | null>(null);
  const [initialSettlementAccount, setInitialSettlementAccount] = useState<MerchantAccountGetOutput | null>(null);

  useEffect(() => {
    const fetchSettlementAccount = async () => {
      const accountDetails = await pylon.getSettlementAccount();

      if (!accountDetails) return;

      setSettlementAccount(accountDetails);
      setInitialSettlementAccount(accountDetails);
    };

    if (selectedService === "widget-management") {
      fetchSettlementAccount();
    }
  }, [selectedService]);

  const hasSettingsChanges = () => {
    if (!settlementAccount || !initialSettlementAccount) return false;

    return (
      settlementAccount.ledgerAddress !== initialSettlementAccount.ledgerAddress ||
      settlementAccount.network !== initialSettlementAccount.network ||
      settlementAccount.currency !== initialSettlementAccount.currency
    );
  };

  const handleSaveSettings = async () => {
    if (!hasSettingsChanges() || !settlementAccount) return;

    const isSaved = await pylon.setSettlementAccount(settlementAccount.id);

    if (isSaved) {
      setInitialSettlementAccount(settlementAccount);
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
            hasChanges={hasSettingsChanges()}
            selectedCurrency={settlementAccount?.currency ?? StableCurrency.USDC}
            selectedNetwork={settlementAccount?.network ?? Network.BASE}
            settlementAddress={settlementAccount?.ledgerAddress ?? ""}
            onCurrencyChange={(currency) => setSettlementAccount((prev) => (prev ? { ...prev, currency } : null))}
            onNetworkChange={(network) => setSettlementAccount((prev) => (prev ? { ...prev, network } : null))}
            onSettlementAddressChange={(ledgerAddress) =>
              setSettlementAccount((prev) => (prev ? { ...prev, ledgerAddress } : null))
            }
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
            classNames={{
              tabList: "border-small",
            }}
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
              icon={SaveIcon}
              isDisabled={!hasSettingsChanges()}
              label="Save Settings"
              type="primary"
              onPress={handleSaveSettings}
            />
          )}
          {selectedService === "order-links" && (
            <ResponsiveButton icon={PlusIcon} label="Create Order Link" onPress={() => setIsCreateModalOpen(true)} />
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
