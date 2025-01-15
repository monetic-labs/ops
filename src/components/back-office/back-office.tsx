import { Tab, Tabs } from "@nextui-org/tabs";
import { useState } from "react";

import { backOfficeConfig } from "@/config/tabs";

import Payments from "./payments-tab";
import CreateOrders from "./orders-tab";
import WidgetManagement from "./widget-tab";

type RevenueStreamsTabsProps = {
  handleSubTabChange: (key: string) => void;
};

export default function RevenueStreamsTabs({ handleSubTabChange }: RevenueStreamsTabsProps) {
  const [selectedService, setSelectedService] = useState<string>(backOfficeConfig[0].id);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "payments":
        return <Payments />;
      case "create-orders":
        return <CreateOrders />;
      case "widget-mgmt":
        return <WidgetManagement />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs
          aria-label="Back Office options"
          classNames={{
            base: "w-full overflow-x-auto sm:overflow-x-visible",
            tabList: "bg-charyo-500/60 backdrop-blur-sm border-none",
            tab: "flex-grow sm:flex-grow-0",
            tabContent: "text-notpurple-500/60",
          }}
          selectedKey={selectedService}
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {backOfficeConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
    </div>
  );
}
