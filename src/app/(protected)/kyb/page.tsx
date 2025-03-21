"use client";

import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";
import { StatusCard } from "@/components/kyb-status/status-card";
import { DocumentTips } from "@/components/kyb-status/document-tips";
import { AlertTriangle, FileText } from "lucide-react";
import { Button } from "@nextui-org/button";
import { useRef } from "react";

export default function KYB() {
  const { complianceStatus } = useGetComplianceStatus();
  const guidelinesRef = useRef<HTMLDivElement>(null);

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

  const scrollToGuidelines = () => {
    guidelinesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="w-full flex justify-center px-4">
      <div className="w-full max-w-full flex flex-col items-center justify-center">
        <div className="w-full bg-content1/90 backdrop-blur-sm border border-border rounded-xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Verification Status</h1>
            <p className="max-w-2xl mx-auto text-lg font-medium text-default-600">
              Complete your business and personal verification to access all features.
            </p>
          </div>

          {/* Critical Alert at Top */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg bg-warning-50 border border-warning-200">
            <div className="flex gap-3 items-start">
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
            <h2 className="text-2xl font-semibold mb-4">Business Verification (KYB)</h2>
            <div className="grid md:grid-cols-2 gap-6">
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
              <h2 className="text-2xl font-semibold mb-4">Personal Verification (KYC)</h2>
              <div className="grid md:grid-cols-2 gap-6">
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
            <h2 className="text-2xl font-semibold mb-4">Document Upload Guidelines</h2>
            <DocumentTips hideAlert={true} />
          </div>
        </div>
      </div>
    </section>
  );
}
