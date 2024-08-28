import { Button } from "@nextui-org/button";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useState } from "react";

import CardListTable from "./card-list";
import Transactions from "./transactions";

import { cardServicesConfig } from "@/config/tabs";
import CreateCardModal from "@/components/modals/card-create";

export default function CardServicesTabs() {
  const [selectedService, setSelectedService] = useState<string>(
    cardServicesConfig[0].id,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <div className="flex justify-between items-center mb-4">
        <Tabs
          aria-label="Service options"
          selectedKey={selectedService}
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {cardServicesConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          Create Card
        </Button>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateCardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
