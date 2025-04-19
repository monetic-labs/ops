"use client";

import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";
import { StatusCard } from "@/components/kyb-status/status-card";
import { DocumentTips } from "@/components/kyb-status/document-tips";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { Button } from "@heroui/button";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/generics/useToast";
import { useRouter } from "next/navigation";
import { BridgeComplianceKycStatus, CardCompanyStatus } from "@monetic-labs/sdk";

export default function KYB() {
  const { complianceStatus, refetch } = useGetComplianceStatus();
  const guidelinesRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isFullyApproved = (status: typeof complianceStatus) => {
    if (!status) return false;

    return (
      status.kycStatus === BridgeComplianceKycStatus.APPROVED &&
      status.rainKybStatus === CardCompanyStatus.APPROVED &&
      (!status.rainKycStatus || status.rainKycStatus === CardCompanyStatus.APPROVED)
    );
  };

  const handleBridgeKYB = () => {
    if (complianceStatus?.kycLink) {
      window.open(complianceStatus.kycLink, "_blank");
    }
  };

  const handleRainKYB = () => {
    if (complianceStatus?.rainKybLink) {
      window.open(complianceStatus.rainKybLink, "_blank");
    }
  };

  // display the UBO KYC information (individual to user)
  const handleRainKYC = () => {
    if (complianceStatus?.rainKycLink) {
      window.open(complianceStatus.rainKycLink, "_blank");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updatedStatus = await refetch();

      if (isFullyApproved(updatedStatus)) {
        toast({
          title: "Verification Complete",
          description: "All verifications are approved. Redirecting to dashboard...",
        });
        // Short delay to show the success message before redirect
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        toast({
          title: "Status Updated",
          description: "Verification status has been refreshed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh verification status",
        variant: "destructive",
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
    <section className="w-full flex justify-center">
      <div className="w-full max-w-full flex flex-col items-center justify-center">
        <div className="w-full bg-content1/90 backdrop-blur-sm border border-border rounded-xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Verification Status</h1>
            <p className="text-base sm:text-lg font-medium text-default-600">
              Complete your business and personal verification to access all features.
            </p>
          </div>

          {/* Critical Alert at Top */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 sm:p-4 rounded-lg bg-warning-50 border border-warning-200">
            <div className="flex gap-3 items-start flex-1">
              <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-warning-700">
                We&apos;re currently experiencing review delays of up to several days. Providing complete and accurate
                documentation upfront will help expedite your verification.
              </p>
            </div>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              startContent={<FileText size={14} />}
              onPress={scrollToGuidelines}
              className="mt-2 md:mt-0 md:ml-2 md:flex-shrink-0 md:whitespace-nowrap w-full md:w-auto"
            >
              View Guidelines
            </Button>
          </div>

          {/* Business Verification Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Business Verification (KYB)</h2>
              <Button
                variant="light"
                size="sm"
                isLoading={isRefreshing}
                onPress={handleRefresh}
                startContent={<RefreshCw className="w-4 h-4" />}
                className="bg-transparent hover:bg-content3/40 w-full sm:w-auto justify-center"
              >
                Check for Updates
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <StatusCard
                provider="BRIDGE"
                status={complianceStatus?.kycStatus}
                type="KYB"
                onVerify={handleBridgeKYB}
              />
              <StatusCard
                provider="RAIN"
                status={complianceStatus?.rainKybStatus}
                type="KYB"
                onVerify={handleRainKYB}
              />
            </div>
          </div>

          {/* Personal Verification Section */}
          {complianceStatus?.rainKycStatus && (
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Personal Verification (KYC)</h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <StatusCard
                  provider="RAIN"
                  status={complianceStatus?.rainKycStatus}
                  type="KYC"
                  onVerify={handleRainKYC}
                />
              </div>
            </div>
          )}

          {/* Document Tips Section */}
          <div ref={guidelinesRef}>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Document Upload Guidelines</h2>
            <DocumentTips hideAlert={true} />
          </div>
        </div>
      </div>
    </section>
  );
}
