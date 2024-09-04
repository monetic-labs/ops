"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Tab, Tabs } from "@nextui-org/tabs";

import WidgetManagement from "@/components/back-office/widget-tab";
import BackOfficeTabs from "@/components/back-office/back-office";
import BillPayTab from "@/components/bill-pay/bill-pay";
import CardServicesTabs from "@/components/card-issuance";
import ComplianceTable from "@/components/compliance/compliance";
import UsersTab from "@/components/users/users";
import { tabsConfig } from "@/config/tabs";

export default function MerchantServicesTabs() {
  const [selectedService, setSelectedService] = useState<string>(tabsConfig[0].id);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "card-issuance":
        return (
          <>
            <CardServicesTabs />
            <Divider className="my-4" />
          </>
        );
      case "users":
        return (
          <>
            <UsersTab />
            <Divider className="my-4" />
          </>
        );
      case "bill-pay":
        return (
          <>
            <BillPayTab />
            <Divider className="my-4" />
          </>
        );
      case "back-office":
        return (
          <>
            <BackOfficeTabs />
            <Divider className="my-4" />
          </>
        );
      case "widget-mgmt":
        return (
          <>
            <WidgetManagement />
            <Divider className="my-4" />
          </>
        );
      case "compliance":
        return <ComplianceTable />;
      default:
        return <div>Tab content not here</div>;
    }
  };

  return (
    <div className="w-full">
      <Tabs
        aria-label="Service options"
        classNames={{
          base: "w-full overflow-x-auto sm:overflow-x-visible",
          tabList: "bg-charyo-500/60 backdrop-blur-sm border-none",
          tab: "flex-grow sm:flex-grow-0",
          tabContent: "text-notpurple-500/60",
        }}
        selectedKey={selectedService}
        onSelectionChange={(key) => setSelectedService(key as string)}
      >
        {tabsConfig.map((tab) => (
          <Tab key={tab.id} title={tab.label}>
            <Card className="bg-charyo-500/60 backdrop-blur-sm">
              <CardHeader className="flex flex-col items-start">
                <h3 className="text-lg font-semibold">{tab.label} Services</h3>
                <p className="text-small text-notpurple-500">{tab.content}</p>
              </CardHeader>
              <Divider />
              <CardBody>{renderTabContent(tab.id)}</CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
