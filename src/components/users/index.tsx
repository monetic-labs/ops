"use client";

import { useState } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { PlusIcon } from "lucide-react";

import MembersTab from "./members-tab";
import DeveloperAccess from "./developer-access";

const userTabsConfig = [
  {
    id: "members",
    label: "Members",
  },
  {
    id: "developer",
    label: "Developer Access",
  },
];

export default function UserTab({ userId }: { userId: string }) {
  const [selectedTab, setSelectedTab] = useState<string>(userTabsConfig[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "members":
        return <MembersTab userId={userId} isCreateModalOpen={isModalOpen} setIsCreateModalOpen={setIsModalOpen} />;
      case "developer":
        return <DeveloperAccess />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <Tabs
          aria-label="User management options"
          selectedKey={selectedTab}
          variant="bordered"
          onSelectionChange={(key) => setSelectedTab(key as string)}
          disabledKeys={["developer"]}
        >
          {userTabsConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        {selectedTab === "members" && (
          <Button
            isIconOnly
            className="bg-charyo-500/60 backdrop-blur-sm border border-white/5"
            data-testid="create-transfer-button"
            onPress={() => setIsModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-4">{renderTabContent(selectedTab)}</div>
    </div>
  );
}
