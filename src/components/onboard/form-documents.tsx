import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { MerchantCreateOutput } from "@backpack-fux/pylon-sdk";
import dynamic from "next/dynamic";

const PersonaVerification = dynamic(() => import("./persona-verification"), { ssr: false });

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
  const [useHostedFlow, setUseHostedFlow] = useState(false);
  const kycLink = merchantResponse?.data.kycLink || null;
  const tosLink = merchantResponse?.data.tosLink || null;

  const handleKYCRedirect = () => {
    if (kycLink) {
      window.open(kycLink, "_blank");
    }
  };

  const handlePersonaComplete = (inquiryId: string, status: string) => {
    console.log(`Inquiry ${inquiryId} completed with status ${status}`);
    // Handle completion, e.g., update your backend
  };

  const handlePersonaCancel = () => {
    console.log("User canceled verification");
    setUseHostedFlow(true);
  };

  const handlePersonaError = (error: any) => {
    console.error("Error during verification:", error);
    setUseHostedFlow(true);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">      
      {useHostedFlow ? (
        <div className="mb-4 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
          <p>Please complete your KYC verification by clicking the button below:</p>
          <Button onClick={handleKYCRedirect} className="mt-2">
            Start KYC Verification
          </Button>
        </div>
      ) : (
        kycLink && (
          <div className="mb-4 p-4 border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
            <PersonaVerification
              kycLink={kycLink}
              onComplete={handlePersonaComplete}
              onCancel={handlePersonaCancel}
              onError={handlePersonaError}
            />
          </div>
        )
      )}
      
      {tosLink && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={tosLink}
              title="Terms of Service Document"
              className="w-full h-96 border-none"
            />
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <p className="mb-2">This application uses Bridge to securely connect accounts and move funds.</p>
            <p className="mb-4">By clicking "Accept", you agree to Bridge's Terms of Service and Privacy Policy.</p>
            <Button onClick={() => {/* Handle TOS acceptance */}} className="mb-2">
              Accept
            </Button>
            <p className="text-green-500">Success! Thanks for accepting our Terms of Service and Privacy Policy!</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-6">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step2 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step2}
          onClick={() => onSubmitStep(3)}
        >
          Submit Documents
        </Button>
      </div>
    </div>
  );
};
