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

import BackOfficeTabs from "@/components/back-office/back-office";
import BillPayTabs from "@/components/bill-pay/bill-pay";
import CardServicesTabs from "@/components/card-issuance";
import UserTab from "@/components/users";
import { tabsConfig } from "@/config/tabs";
import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";

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
      complianceStatus.rainKybStatus !== RainKybStatus.APPROVED
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
      default:
        return <div>Tab content not here</div>;
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full bg-content1/90 border border-default-200/50 backdrop-blur-sm">
        <CardBody className="w-full p-0">
          <Tabs
            aria-label="Service options"
            classNames={{
              base: "w-full",
              tabList: "w-full relative px-6 py-2 gap-6",
              cursor: "w-full bg-notpurple-500 h-[2px]",
              tab: "max-w-fit px-0 h-12",
              panel: "w-full p-0",
            }}
            selectedKey={selectedService}
            variant="underlined"
            onSelectionChange={(key) => handleTabChange(key as string)}
          >
            {tabsConfig.map((tab) => (
              <Tab
                key={tab.id}
                title={
                  <Tooltip
                    classNames={{
                      content: "text-default-600 rounded-lg shadow-xl bg-content2/90 text-sm",
                    }}
                    closeDelay={0}
                    content={tab.content}
                    delay={0}
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
                <div className="w-full px-6 py-4">{renderTabContent(tab.id)}</div>
              </Tab>
            ))}
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
