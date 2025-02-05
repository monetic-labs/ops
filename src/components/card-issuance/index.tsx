import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Tab, Tabs } from "@nextui-org/tabs";
import { PlusIcon } from "lucide-react";

import { cardServicesConfig } from "@/config/tabs";
import CreateCardModal from "@/components/card-issuance/card-create";

import CardListTable from "./card-list";
import TransactionListTable from "./transactions";

type CardServicesTabsProps = {
  handleSubTabChange: (key: string) => void;
};

export default function CardServicesTabs({ handleSubTabChange }: CardServicesTabsProps) {
  const [selectedService, setSelectedService] = useState<string>(cardServicesConfig[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "transactions":
        return <TransactionListTable />;
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
          variant="bordered"
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {cardServicesConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        <Button
          isIconOnly
          className="bg-charyo-500/60 backdrop-blur-sm border border-white/5"
          data-testid="create-transfer-button"
          onPress={() => setIsCreateModalOpen(true)}
        >
          <PlusIcon size={18} />
        </Button>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateCardModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
