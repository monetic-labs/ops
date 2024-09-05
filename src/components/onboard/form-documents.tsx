import React, { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { MerchantCreateOutput } from "@backpack-fux/pylon-sdk";
import { Client } from "persona";

interface DocumentsProps {
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
  merchantResponse: MerchantCreateOutput | null;
}

export const Documents: React.FC<DocumentsProps> = ({
  handleCancel,
  onSubmitStep,
  stepCompletion,
  merchantResponse,
}) => {
  const personaRef = useRef<HTMLDivElement>(null);
  const [useHostedFlow, setUseHostedFlow] = useState(false);
  const kycLink = merchantResponse?.data?.kycLink || null;
  const tosLink = merchantResponse?.data?.tosLink || null;

  useEffect(() => {
    if (kycLink && personaRef.current) {
      const url = new URL(kycLink);
      const templateId = url.searchParams.get("inquiry-template-id");
      const environmentId = url.searchParams.get("environment-id");
      const developerId = url.searchParams.get("developer-id");
      const referenceId = url.searchParams.get("reference-id");

      if (templateId && environmentId && referenceId && developerId) {
        try {
          const client = new Client({
            fields: {
              developer_id: developerId,
            },
            templateId: templateId,
            environmentId: environmentId,
            referenceId: referenceId,
            onComplete: ({ inquiryId, status, fields }) => {
              console.log(`Inquiry ${inquiryId} completed with status ${status}`);
              // Handle completion, e.g., update your backend
            },
            onCancel: () => {
              console.log("User canceled verification");
            },
            onError: (error) => {
              console.error("Error during verification:", error);
              setUseHostedFlow(true);
            },
          });

          client.open();
        } catch (error) {
          console.error("Failed to initialize Persona client:", error);
          setUseHostedFlow(true);
        }
      } else {
        console.error("Unable to extract templateId or environmentId from kycLink");
        setUseHostedFlow(true);
      }
    }
  }, [kycLink]);

  const handleKYCRedirect = () => {
    if (kycLink) {
      window.open(kycLink, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {useHostedFlow ? (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
          <p>Please complete your KYC verification by clicking the button below:</p>
          <Button onClick={handleKYCRedirect} className="mt-2">
            Start KYC Verification
          </Button>
        </div>
      ) : (
        <div ref={personaRef} className="w-full h-96" />
      )}
      {tosLink && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
          <iframe src={tosLink} className="w-full h-96 border border-gray-300 rounded" />
        </div>
      )}
      <div className="flex justify-between">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step2 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step2}
          onClick={() => onSubmitStep(3)}
        >
          Step 3: Submit Documents
        </Button>
      </div>
    </div>
  );
};
