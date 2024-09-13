import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Link } from "@nextui-org/link";

import { FormCard } from "@/components/generics/form-card";
import { signBridgeTermsOfService } from "@/utils/merchant/signBridgeTOS";

interface TermsAndKYBProps {
  tosLink: string | null;
  kybLink: string | null;
  onCancel: () => void;
}

export const TermsAndKYB: React.FC<TermsAndKYBProps> = ({ tosLink, kybLink, onCancel }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAcceptTerms = async () => {
    if (tosLink) {
      try {
        const result = await signBridgeTermsOfService(tosLink);

        if (result.signed_agreement_id) {
          setTermsAccepted(true);
        }
      } catch (error) {
        console.error("Error accepting terms:", error);
      }
    }
  };

  const handleStartKYB = () => {
    if (kybLink) {
      window.open(kybLink, "_blank");
    }
  };

  return (
    <FormCard title="Terms of Service & KYB Verification">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Accept Terms & Conditions</h3>
        </CardHeader>
        <CardBody>
          <p className="mb-4">This application uses Bridge to securely connect accounts and move funds.</p>
          <p className="mb-4">
            By clicking &apos;Accept&apos;, you agree to Bridge&apos;s{" "}
            <Link href="https://www.bridge.xyz/legal" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="https://www.bridge.xyz/legal?tab=eea-privacy-policy" target="_blank">
              Privacy Policy
            </Link>
          </p>
        </CardBody>
        <CardFooter>
          <Button
            className="w-full bg-ualert-500 text-notpurple-100"
            disabled={termsAccepted}
            onClick={handleAcceptTerms}
          >
            {termsAccepted ? "Terms Accepted" : "Accept Terms"}
          </Button>
        </CardFooter>
      </Card>

      {termsAccepted && (
        <Card className="mt-4">
          <CardHeader>
            <h3 className="text-lg font-semibold">KYB Verification</h3>
          </CardHeader>
          <CardBody>
            <p className="mb-4">Please complete your KYB verification by clicking the button below:</p>
          </CardBody>
          <CardFooter>
            <Button className="w-full bg-ualert-500 text-notpurple-100" onClick={handleStartKYB}>
              Start KYB Verification
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </FormCard>
  );
};
