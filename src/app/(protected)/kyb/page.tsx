"use client";

import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";
import { StatusCard } from "@/components/kyb-status/status-card";

export default function KYB() {
  const { complianceStatus } = useGetComplianceStatus();

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

  return (
    <section className="flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl backdrop-blur-md bg-background/40 rounded-3xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Verification Status</h1>
          <p className="text-white/90 max-w-2xl mx-auto text-lg font-medium">
            Complete your business and personal verification to access all features.
          </p>
        </div>

        {/* Business Verification Section */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Business Verification (KYB)</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <StatusCard provider="BRIDGE" status={complianceStatus?.kycStatus} type="KYB" onVerify={handleBridgeKYB} />
            <StatusCard provider="RAIN" status={complianceStatus?.rainKybStatus} type="KYB" onVerify={handleRainKYB} />
          </div>
        </div>

        {/* Personal Verification Section */}
        {complianceStatus?.rainKycStatus && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Personal Verification (KYC)</h2>
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

        {/* Support Section */}
        <div className="text-center text-white/80">
          Need help? <button className="underline hover:text-white transition-colors">Contact our support team</button>{" "}
          for assistance with your verification process.
        </div>
      </div>
    </section>
  );
}
