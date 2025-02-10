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
import { Button } from "@nextui-org/button";
import { CreditCard, Building2, Users, Settings, Receipt } from "lucide-react";

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
  const initialTab = searchParams?.get("tab") || "bill-pay";
  const [selectedService, setSelectedService] = useState<string>(initialTab);

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", key);
    params.delete("subtab");

    // Scroll to tabs when changing tabs to ensure account view collapses
    window.scrollTo({
      top: 200,
      behavior: "smooth",
    });

    router.replace(`/?${params.toString()}`, { scroll: false });
    setSelectedService(key);
  };

  const handleSubTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("subtab", key);
    // Use replace to prevent scroll to top
    router.replace(`/?${params.toString()}`, { scroll: false });
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
      case "bill-pay":
        return <BillPayTabs handleSubTabChange={handleSubTabChange} />;
      case "back-office":
        return <BackOfficeTabs handleSubTabChange={handleSubTabChange} />;
      case "card-issuance":
        return <CardServicesTabs handleSubTabChange={handleSubTabChange} />;
      case "users":
        return <UserTab userId={userId} />;
      default:
        return <div>Tab content not here</div>;
    }
  };

  const navigationItems = [
    {
      id: "bill-pay",
      label: "Bill Pay",
      icon: <Receipt className="w-4 h-4" />,
      tooltip: "Pay vendors and manage recurring payments",
    },
    {
      id: "back-office",
      label: "Back Office",
      icon: <Building2 className="w-4 h-4" />,
      tooltip: "Manage your business operations",
    },
    {
      id: "card-issuance",
      label: "Card Issuance",
      icon: <CreditCard className="w-4 h-4" />,
      tooltip: "Issue and manage corporate cards",
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      tooltip: "Manage team members and permissions",
    },
  ];

  return (
    <div className="w-full">
      <Card className="w-full bg-content1/90 border border-default-200/50 backdrop-blur-sm">
        <CardBody className="w-full p-0">
          <div className="w-full border-b border-border">
            <div className="flex items-center sm:gap-2 px-6">
              {navigationItems.map((item) => (
                <Tooltip
                  key={item.id}
                  content={item.tooltip}
                  classNames={{
                    content: "bg-content2/90 text-foreground text-xs px-2 py-1",
                  }}
                  delay={500}
                  closeDelay={0}
                >
                  <Button
                    className={`
                      flex items-center gap-2 px-4 py-2 min-h-[48px] rounded-none border-b-2 
                      ${
                        selectedService === item.id
                          ? "border-primary text-foreground bg-content2/40"
                          : "border-transparent text-foreground/60 hover:text-foreground hover:bg-content2/20"
                      }
                      transition-colors
                    `}
                    variant="light"
                    onPress={() => handleTabChange(item.id)}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full px-6 py-4">{renderTabContent(selectedService)}</div>
        </CardBody>
      </Card>
    </div>
  );
}
