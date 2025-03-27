"use client";

import { useState } from "react";
import { Tab, Tabs } from "@heroui/tabs";
import { PlusIcon } from "lucide-react";

import { ResponsiveButton } from "../generics/responsive-button";

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
        return <MembersTab isCreateModalOpen={isModalOpen} setIsCreateModalOpen={setIsModalOpen} userId={userId} />;
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
          classNames={{
            tabList: "border-small",
          }}
          disabledKeys={["developer"]}
          selectedKey={selectedTab}
          variant="bordered"
          onSelectionChange={(key) => setSelectedTab(key as string)}
        >
          {userTabsConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        {selectedTab === "members" && (
          <ResponsiveButton icon={PlusIcon} label="Add User" onPress={() => setIsModalOpen(true)} />
        )}
      </div>
      <div className="mt-4">{renderTabContent(selectedTab)}</div>
    </div>
  );
}
