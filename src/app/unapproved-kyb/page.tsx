"use client";

import { Button } from "@nextui-org/button";

import { title } from "@/components/primitives";
import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";

export default function UnapprovedKYB() {
  const { complianceStatus } = useGetComplianceStatus();

  console.log(complianceStatus);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 px-4 max-w-3xl mx-auto">
      <h1 className={title({ color: "chardient" })}>KYB Verification in Progress</h1>
      <div className="bg-background/60 backdrop-blur-md rounded-lg p-6 shadow-lg w-full max-w-md">
        {complianceStatus && (
          <div>
            <p className="mb-4">
              Your BRIDGE KYB status is {complianceStatus.kycStatus}. You can check your full KYB status below and add
              any missing information.
            </p>
            <Button
              className="w-full bg-ualert-500 text-notpurple-100"
              onClick={() => window.open(complianceStatus.kycLink, "_blank")}
            >
              Check BRIDGE KYB status
            </Button>
            <p className="mb-4">
              Your RAIN KYB status is {complianceStatus.applicationStatus}. You can check your full KYB status below and
              add any missing information.
            </p>
            <Button
              className="w-full bg-ualert-500 text-notpurple-100"
              onClick={() => window.open(complianceStatus.applicationExternalVerificationLink.url, "_blank")}
            >
              Rain External Verification Link
            </Button>
            <Button
              className="w-full bg-ualert-500 text-notpurple-100"
              onClick={() => window.open(complianceStatus.applicationCompletionLink.url, "_blank")}
            >
              Rain Completion Link
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
