"use client";
import { title } from "@/components/primitives";
import { useGetComplianceStatus } from "@/hooks/merchant/useGetComplianceStatus";
import { Button } from "@nextui-org/button";

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
              Your KYB status is {complianceStatus.kycStatus}. You can check your full KYB status below and add any
              missing information.
            </p>
            <Button
              className="w-full bg-ualert-500 text-notpurple-100"
              onClick={() => window.open(complianceStatus.kycLink, "_blank")}
            >
              Check KYB status
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
