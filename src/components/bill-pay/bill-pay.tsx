import { useState } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { PlusIcon } from "lucide-react";

import { billPayConfig } from "@/config/tabs";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { NewBillPay, ExistingBillPay } from "@/types/bill-pay";
import { isTesting } from "@/utils/helpers";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { ResponsiveButton } from "@/components/generics/responsive-button";
import { useAccounts } from "@/contexts/AccountContext";
import { Account } from "@/types/account";

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

  const { accounts } = useAccounts();
  const settlementAccount = accounts.find(
    (account) => account.isSettlement && account.isDeployed && !account.isDisabled
  ) as Account;
  const settlementAddress = isTesting ? MOCK_SETTLEMENT_ADDRESS : settlementAccount?.address;

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
          classNames={{
            tabList: "border-small",
          }}
          selectedKey={selectedService}
          variant="bordered"
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {billPayConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        {selectedService === "transfers" && (
          <ResponsiveButton
            icon={PlusIcon}
            isDisabled={!settlementAddress}
            label="Create Transfer"
            onPress={() => setIsCreateModalOpen(true)}
          />
        )}
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateBillPayModal
        billPay={billPay}
        isOpen={isCreateModalOpen}
        setBillPay={setBillPay}
        settlementAddress={settlementAddress}
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
