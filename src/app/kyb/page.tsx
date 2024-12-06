"use client";

import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";
import { StatusCard } from "@/components/kyb-status/status-card";

export default function KYB() {
  const { complianceStatus } = useGetComplianceStatus();

  console.log(complianceStatus); // TODO: Remove

  const handleBridgeKYB = () => {
    if (complianceStatus?.kycLink) {
      window.open(complianceStatus.kycLink, "_blank");
    }
  };

  const handleRainKYB = () => {
    if (complianceStatus?.link) {
      window.open(complianceStatus.link, "_blank");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8 backdrop-blur-sm p-6 rounded-2xl bg-background/40">
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-md">KYB Verification Status</h1>
        <p className="text-white/90 max-w-2xl mx-auto text-lg font-medium drop-shadow">
          Complete your verification process with our trusted providers to access all features.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
        <StatusCard provider="BRIDGE" status={complianceStatus?.kycStatus} onVerify={handleBridgeKYB} />
        <StatusCard provider="RAIN" status={complianceStatus?.status} onVerify={handleRainKYB} />
      </div>

      <div className="mt-6 text-center text-sm text-white/80 backdrop-blur-sm bg-background/40 px-6 py-3 rounded-full">
        Need help?{" "}
        <button
          className="underline hover:text-white"
          onClick={() => {
            // TODO: Add support link
          }}
        >
          Contact our support team
        </button>{" "}
        for assistance with your verification process.
      </div>
    </section>
  );
}
