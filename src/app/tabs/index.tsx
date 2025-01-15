"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "@nextui-org/tooltip";
import {
  BridgeComplianceKycStatus as BridgeKybStatus,
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
import { components } from "@/styles/theme/components";

export default function MerchantServicesTabs({ userId }: { userId: string }) {
  const { complianceStatus } = useGetComplianceStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || tabsConfig[0].id;
  const [selectedService, setSelectedService] = useState<string>(initialTab);

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", key);
    params.delete("subtab");
    router.push(`/?${params.toString()}`);
    setSelectedService(key);
  };

  const handleSubTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("subtab", key);
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    if (
      complianceStatus &&
      complianceStatus.kycStatus !== BridgeKybStatus.APPROVED &&
      complianceStatus.status !== RainKybStatus.APPROVED
    ) {
      router.push("/kyb");
    }
  }, [complianceStatus]);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "card-issuance":
        return <CardServicesTabs handleSubTabChange={handleSubTabChange} />;
      case "bill-pay":
        return <BillPayTabs handleSubTabChange={handleSubTabChange} />;
      case "back-office":
        return <BackOfficeTabs handleSubTabChange={handleSubTabChange} />;
      case "users":
        return <UserTab userId={userId} />;
      case "widget-mgmt":
        return <WidgetManagement />;
      case "compliance":
        return <ComplianceTable />;
      default:
        return <div>Tab content not here</div>;
    }
  };

  return (
    <div className="w-full">
      <Card className={components.card.base}>
        <CardBody className="p-0">
          <Tabs
            aria-label="Service options"
            variant="underlined"
            classNames={{
              base: "w-full",
              tabList: "w-full relative px-6 py-2 border-b border-divider gap-6",
              cursor: "w-full bg-black dark:bg-notpurple-500",
              tab: "max-w-fit px-0 h-12",
              tabContent: "text-default-600 text-sm group-data-[selected=true]:text-black dark:group-data-[selected=true]:text-notpurple-500",
              panel: "p-0",
            }}
            selectedKey={selectedService}
            onSelectionChange={(key) => handleTabChange(key as string)}
          >
            {tabsConfig.map((tab) => (
              <Tab
                key={tab.id}
                title={
                  <Tooltip
                    content={tab.content}
                    classNames={{
                      content: "text-default-500 rounded-lg shadow-xl bg-background/90 text-sm",
                    }}
                    delay={0}
                    closeDelay={0}
                    motionProps={{
                      variants: {
                        exit: {
                          opacity: 0,
                          transition: {
                            duration: 0.1,
                            ease: "easeIn",
                          },
                        },
                        enter: {
                          opacity: 1,
                          transition: {
                            duration: 0.15,
                            ease: "easeOut",
                          },
                        },
                      },
                    }}
                  >
                    <span className="cursor-pointer">{tab.label}</span>
                  </Tooltip>
                }
              >
                <div className="px-6 py-4">{renderTabContent(tab.id)}</div>
              </Tab>
            ))}
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
