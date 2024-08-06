"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useState } from "react";

import BillPayTab from "./bill-pay";
import ComplianceTable from "./compliance";
import UsersTab from "./users";

import { tabsConfig } from "@/config/tabs";
import CardServicesTabs from "./card-services";

export default function MerchantServicesTabs() {
  const [selectedService, setSelectedService] = useState<string>(
    tabsConfig[0].id
  );

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "cards":
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
      case "compliance":
        return <ComplianceTable />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="w-full">
      <Tabs
        aria-label="Service options"
        className="w-full"
        selectedKey={selectedService}
        onSelectionChange={(key) => setSelectedService(key as string)}>
        {tabsConfig.map((tab) => (
          <Tab key={tab.id} title={tab.label}>
            <Card className="bg-charyo-500/60 backdrop-blur-sm border-none">
              <CardHeader className="flex flex-col items-start">
                <h3 className="text-lg font-semibold">{tab.label} Services</h3>
                <p className="text-small text-default-500">{tab.content}</p>
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
