import { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "viem";

import { billPayConfig, BillPayId } from "@/config/tabs";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { NewBillPay, ExistingBillPay } from "@/types/bill-pay";
import { isTesting } from "@/utils/helpers";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";

import CreateBillPayModal from "./bill-actions/create";
import Transfers from "./transfers-tab";
import Contacts from "./contacts-tab";

type BillPayTabsProps = {
  handleSubTabChange: (key: string) => void;
};

export default function BillPayTabs({ handleSubTabChange }: BillPayTabsProps) {
  const [billPay, setBillPay] = useState<NewBillPay | ExistingBillPay>(DEFAULT_NEW_BILL_PAY);
  const [selectedService, setSelectedService] = useState<string>(billPayConfig[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const appKitAccount = useAppKitAccount();
  const isConnected = isTesting ? true : appKitAccount.isConnected;
  const settlementAddress = isTesting ? MOCK_SETTLEMENT_ADDRESS : appKitAccount.address;

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
            base: "w-full overflow-x-auto sm:overflow-x-viseible",
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
        <Button color="default" data-testid="create-transfer-button" onPress={() => setIsCreateModalOpen(true)}>
          Create Transfer
        </Button>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateBillPayModal
        billPay={billPay}
        isOpen={isCreateModalOpen}
        isWalletConnected={isConnected}
        setBillPay={setBillPay}
        settlementAddress={settlementAddress as Address}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBillPay(DEFAULT_NEW_BILL_PAY);
        }}
        onSave={(newBillPay) => {
          console.log("Creating transfer:", newBillPay);
        }}
      />
    </div>
  );
}
