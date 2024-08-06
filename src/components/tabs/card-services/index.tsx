import { cardServicesConfig } from "@/config/tabs";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useState } from "react";
import CardListTable from "./card-list";
import Transactions from "./transactions";

export default function CardServicesTabs() {
  const [selectedService, setSelectedService] = useState<string>(
    cardServicesConfig[0].id
  );

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "transactions":
        return <Transactions />;
      case "card-list":
        return <CardListTable />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="w-full">
      <Tabs
        aria-label="Service options"
        selectedKey={selectedService}
        onSelectionChange={(key) => setSelectedService(key as string)}>
        {cardServicesConfig.map((tab) => (
          <Tab key={tab.id} title={tab.label} />
        ))}
      </Tabs>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
    </div>
  );
}
