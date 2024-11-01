import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";

import { billPayConfig, BillPayId } from "@/config/tabs";

import Contacts from "./contacts-tab";
import Transfers from "./transfers-tab";
import CreateBillPayModal from "./bill-actions/create";

export default function BillPayTabs() {
  const [selectedService, setSelectedService] = useState<string>(billPayConfig[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case BillPayId.TRANSFERS:
        return <Transfers />;
      case BillPayId.CONTACTS:
        return <Contacts />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs
          aria-label="Bill Pay options"
          classNames={{
            base: "w-full overflow-x-auto sm:overflow-x-visible",
            tabList: "bg-charyo-500/60 backdrop-blur-sm border-none",
            tab: "flex-grow sm:flex-grow-0",
            tabContent: "text-notpurple-500/60",
          }}
          selectedKey={selectedService}
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {billPayConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          Create Transfer
        </Button>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateBillPayModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newBillPay) => {
          console.log("Creating bill pay:", newBillPay);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
