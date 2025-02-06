import { useState } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "viem";
import { PlusIcon } from "lucide-react";

import { billPayConfig, BillPayId } from "@/config/tabs";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { NewBillPay, ExistingBillPay } from "@/types/bill-pay";
import { isTesting } from "@/utils/helpers";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { ResponsiveButton } from "@/components/generics/responsive-button";

import CreateBillPayModal from "./bill-actions/create";
import TransfersTab from "./transfers-tab";
import ContactsTab from "./contacts-tab";

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
      case "transfers":
        return <TransfersTab />;
      case "contacts":
        return <ContactsTab />;
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
          {billPayConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        {selectedService === "transfers" && (
          <ResponsiveButton label="Create Transfer" icon={PlusIcon} onPress={() => setIsCreateModalOpen(true)} />
        )}
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
