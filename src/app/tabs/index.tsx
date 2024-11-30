"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BridgeComplianceKycStatus as BridgeKybStatus,
  BridgeComplianceTosStatus as BridgeTosStatus,
  CardCompanyStatus as RainKybStatus,
} from "@backpack-fux/pylon-sdk";

import WidgetManagement from "@/components/back-office/widget-tab";
import BackOfficeTabs from "@/components/back-office/back-office";
import BillPayTabs from "@/components/bill-pay/bill-pay";
import CardServicesTabs from "@/components/card-issuance";
import ComplianceTable from "@/components/compliance/compliance";
import UserTab from "@/components/users/users";
import { tabsConfig } from "@/config/tabs";
import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";

export default function MerchantServicesTabs({ userId }: { userId: string }) {
  const { complianceStatus } = useGetComplianceStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || tabsConfig[0].id;
  const [selectedService, setSelectedService] = useState<string>(initialTab);

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    // Clear subtab when main tab changes
    params.delete("subtab");
    // Important: Update the URL first
    router.push(`/?${params.toString()}`);
    // Then update the state
    setSelectedService(key);
  };

  // TODO
  const handleSubTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subtab", key);
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    if (
      complianceStatus &&
      complianceStatus.tosStatus !== BridgeTosStatus.ACCEPTED &&
      complianceStatus.kycStatus !== BridgeKybStatus.APPROVED &&
      complianceStatus.status !== RainKybStatus.APPROVED
    ) {
      router.push("/kyb");
    }
  }, [complianceStatus]);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "card-issuance":
        return (
          <>
            <CardServicesTabs handleSubTabChange={(subtab) => handleSubTabChange(subtab)} />
            <Divider className="my-4" />
          </>
        );
      case "bill-pay":
        return (
          <>
            <BillPayTabs handleSubTabChange={(subtab) => handleSubTabChange(subtab)} />
            <Divider className="my-4" />
          </>
        );
      case "back-office":
        return (
          <>
            <BackOfficeTabs handleSubTabChange={(subtab) => handleSubTabChange(subtab)} />
            <Divider className="my-4" />
          </>
        );
      case "users":
        return (
          <>
            <UserTab userId={userId} />
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
        onSelectionChange={(key) => handleTabChange(key as string)}
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
