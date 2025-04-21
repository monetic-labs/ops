"use client";

import { useGetComplianceStatus } from "@/app/(protected)/kyb/_hooks/useGetComplianceStatus";
import { StatusCard } from "./_components/status-card";
import { DocumentTips } from "./_components/document-tips";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { Button } from "@heroui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/generics/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import { BridgeComplianceKycStatus, CardCompanyStatus } from "@monetic-labs/sdk";
import { Spinner } from "@heroui/spinner";
import { useUser } from "@/contexts/UserContext";
import { useAccounts } from "@/contexts/AccountContext";

export default function KYB() {
  const { complianceStatus, isLoading: isStatusLoading, error: statusError, refetch } = useGetComplianceStatus();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: isUserContextLoading, isFullyApproved, forceAuthCheck } = useUser();
  const { accounts, isLoadingAccounts } = useAccounts();
  const guidelinesRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkIsFullyApproved = useCallback((status: typeof complianceStatus): boolean => {
    if (!status) return false;
    return (
      status.kycStatus === BridgeComplianceKycStatus.APPROVED &&
      status.rainKybStatus === CardCompanyStatus.APPROVED &&
      (!status.rainKycStatus || status.rainKycStatus === CardCompanyStatus.APPROVED)
    );
  }, []);

  useEffect(() => {
    if (isUserContextLoading) {
      return;
    }
    if (isFullyApproved) {
      const redirectPath = searchParams?.get("redirect");
      if (!isLoadingAccounts) {
        const firstAccountId = accounts.length > 0 ? accounts[0].id : null;
        const defaultPath = firstAccountId ? `/account/${firstAccountId}` : "/";
        const targetPath = redirectPath || defaultPath;
        console.log(`KYB Page: User approved (context), redirecting to ${targetPath}`);
        router.replace(targetPath);
      }
    }
  }, [isUserContextLoading, isFullyApproved, isLoadingAccounts, accounts, searchParams, router]);

  const isInitialComplianceLoad = isStatusLoading && !complianceStatus;
  if (isUserContextLoading || isInitialComplianceLoad) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Spinner label="Loading Compliance Status..." color="primary" labelColor="primary" />
      </div>
    );
  }

  const handleBridgeKYB = () => {
    if (complianceStatus?.kycLink) {
      window.open(complianceStatus.kycLink, "_blank");
    } else {
      toast({ variant: "default", title: "Info", description: "Bridge KYC link not available." });
    }
  };

  const handleRainKYB = () => {
    if (complianceStatus?.rainKybLink) {
      window.open(complianceStatus.rainKybLink, "_blank");
    } else {
      toast({ variant: "default", title: "Info", description: "Rain KYB link not available." });
    }
  };

  const handleRainKYC = () => {
    if (complianceStatus?.rainKycLink) {
      window.open(complianceStatus.rainKycLink, "_blank");
    } else {
      toast({ variant: "default", title: "Info", description: "Rain KYC link not available." });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    let updatedStatus = null;
    try {
      updatedStatus = await refetch();

      if (updatedStatus && checkIsFullyApproved(updatedStatus)) {
        await forceAuthCheck();
      } else {
        toast({
          variant: "default",
          title: "Status Updated",
          description: "Verification status has been refreshed.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh verification status.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const scrollToGuidelines = () => {
    guidelinesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="w-full flex justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl flex flex-col items-center justify-center">
        <div className="w-full bg-content1 border border-divider rounded-xl shadow-lg p-6 md:p-8 space-y-6 md:space-y-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Verification Status</h1>
            <p className="text-base text-foreground/70">
              Complete your business and personal verification to access all features.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex gap-3 items-start flex-1">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-warning-emphasis">
                We&apos;re currently experiencing review delays. Providing complete and accurate documentation upfront
                helps expedite verification.
              </p>
            </div>
            <Button
              variant="flat"
              color="warning"
              size="sm"
              startContent={<FileText size={14} />}
              onPress={scrollToGuidelines}
              className="mt-2 md:mt-0 md:ml-2 flex-shrink-0 w-full md:w-auto"
            >
              View Guidelines
            </Button>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Business Verification (KYB)</h2>
              <Button
                variant="light"
                size="sm"
                onPress={handleRefresh}
                startContent={isRefreshing ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                isDisabled={isRefreshing}
                className="w-full sm:w-auto justify-center"
              >
                Check for Updates
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <StatusCard
                provider="BRIDGE"
                status={complianceStatus?.kycStatus}
                type="KYB"
                onVerify={handleBridgeKYB}
                isLoading={isRefreshing || isStatusLoading}
              />
              <StatusCard
                provider="RAIN"
                status={complianceStatus?.rainKybStatus}
                type="KYB"
                onVerify={handleRainKYB}
                isLoading={isRefreshing || isStatusLoading}
              />
            </div>
          </div>

          {complianceStatus?.rainKycStatus && (
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Personal Verification (KYC)</h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <StatusCard
                  provider="RAIN"
                  status={complianceStatus?.rainKycStatus}
                  type="KYC"
                  onVerify={handleRainKYC}
                  isLoading={isRefreshing || isStatusLoading}
                />
                <div className="hidden md:block"></div>
              </div>
            </div>
          )}

          <div ref={guidelinesRef}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Document Upload Guidelines</h2>
            <DocumentTips />
          </div>
        </div>
      </div>
    </section>
  );
}
