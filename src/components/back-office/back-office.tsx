import { Button } from "@nextui-org/button";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useState } from "react";

import Payments from "./payments-tab";
import CreateOrders from "./orders-tab";
import WidgetManagement from "./widget-tab";

import { backOfficeConfig } from "@/config/tabs";

export default function BackOfficeTabs() {
  const [selectedService, setSelectedService] = useState<string>(
    backOfficeConfig[0].id
  );

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