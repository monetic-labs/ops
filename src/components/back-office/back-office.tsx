import { useState, useRef } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { PlusIcon } from "lucide-react";

import { backOfficeConfig } from "@/config/tabs";
import CreateOrderModal from "./create-order-modal";

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

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "payments":
        return <PaymentsTab />;
      case "order-links":
        return <OrdersTab ref={ordersTabRef} onCreateClick={() => setIsCreateModalOpen(true)} />;
      case "widget-management":
        return <WidgetTab />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  const showCreateButton = selectedService === "order-links";

  const handleOrderCreated = async () => {
    setIsCreateModalOpen(false);
    if (ordersTabRef.current) {
      await ordersTabRef.current.refresh();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
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
        {showCreateButton && (
          <Button
            isIconOnly
            className="bg-charyo-500/60 backdrop-blur-sm border border-white/5"
            onPress={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={18} />
          </Button>
        )}
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
