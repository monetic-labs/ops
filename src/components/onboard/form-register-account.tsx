import React, { useState } from "react";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import { useRouter } from "next/navigation";

import { FormCard } from "@/components/generics/form-card";
import { signBridgeTermsOfService } from "@/utils/merchant/signBridgeTOS";

import { OTPVerificationModal } from "../generics/otp-modal";
import { VerifyOTP } from "@backpack-fux/pylon-sdk";
import { CompanyUserDetailsSchema } from "@/types/validations/onboard";

interface AccountRegistrationProps {
  tosBridgeLink: string | null;
  kybBridgeLink: string | null;
  onCancel: () => void;
  onKYCDone: () => void;
  isRainToSAccepted: boolean;
  handleRainToSAccepted: () => Promise<void>;
  rainToSError: string | null;
  email: string;
  accountUsers: {
    firstName: string;
    lastName: string;
    role: "owner" | "beneficial-owner" | "representative";
  }[];
  userDetails: CompanyUserDetailsSchema["userDetails"];
}

export const AccountRegistration: React.FC<AccountRegistrationProps> = ({
  tosBridgeLink: tosLink,
  kybBridgeLink: kybLink,
  onCancel,
  onKYCDone,
  isRainToSAccepted,
  handleRainToSAccepted,
  rainToSError,
  email,
  accountUsers,
  userDetails,
}) => {
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [isBridgeToSAccepted, setBridgeToSAccepted] = useState(false);
  const router = useRouter();
  let isOTPVerified = false;

  const handleBridgeAcceptToS = async () => {
    if (tosLink) {
      try {
        const result = await signBridgeTermsOfService(tosLink);

        if (result.signed_agreement_id) {
          setBridgeToSAccepted(true);
          setIsOTPModalOpen(true);
          console.log("Terms accepted");
        }
      } catch (error) {
        console.error("Error accepting terms:", error);
      }
    }
  };

  // Function to handle OTP verification success
  const handleOTPVerified = () => {
    setIsOTPModalOpen(false);
    console.log("OTP verification success");
    isOTPVerified = true;
    //onKYCDone();
    return null;
  };

  const handleRainAcceptToS = async () => {
    await handleRainToSAccepted();
  };

  const handleKYB = () => {
    router.push("/kyb");
  };

  const itemClasses = {
    base: "py-0 w-full",
    title: "font-normal text-medium",
    trigger: "px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center",
    indicator: "text-medium",
    content: "text-small px-2",
  };

  const accordionItems = [
    <AccordionItem key="1" aria-label="Bill Pay Agreement" data-testid="bill-pay-agreement" title="Bill Pay Agreement">
      <p className="mb-4">
        At Bridge, we are advancing the accessibility of stablecoins and stablecoin-based applications.
        &quot;Stablecoins&quot; are a special type of cryptographic digital asset that can be redeemed at face value for
        government-issued money (“Fiat Currency”). By clicking &apos;Accept&apos;, you agree to Bridge&apos;s{" "}
        <Link href="https://www.bridge.xyz/legal" target="_blank">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="https://www.bridge.xyz/legal?tab=eea-privacy-policy" target="_blank">
          Privacy Policy
        </Link>
      </p>
      <Button
        data-testid="bill-pay-agreement-button"
        className="w-full bg-ualert-500 text-notpurple-100"
        isDisabled={!isBridgeToSAccepted}
        onClick={handleBridgeAcceptToS}
      >
        {isBridgeToSAccepted ? "Terms Accepted" : "Accept Terms"}
      </Button>
    </AccordionItem>,

    <AccordionItem
      key="2"
      aria-label="Card Program Agreement"
      data-testid="card-program-agreement"
      title="Card Program Agreement"
    >
      <p className="mb-4">
        The Rain Corporate Card (&quot;Rain Card&quot;) is a business card issued to the Account holder under the Rain
        Platform Agreement and the Rain Corporate Card Agreement. The Rain Corporate Card is issued by Third National
        (&quot;Issuer&quot;).
        <Link href="https://www.raincards.xyz/legal/docs/corporate-card-user-agreement" target="_blank">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="https://www.raincards.xyz/legal/docs/privacy-policy" target="_blank">
          Privacy Policy
        </Link>
      </p>
      <Button
        data-testid="card-program-agreement-button"
        className="w-full bg-ualert-500 text-notpurple-100"
        isDisabled={!isRainToSAccepted}
        onClick={handleRainAcceptToS}
      >
        {isRainToSAccepted ? "Terms Accepted" : "Accept Terms"}
      </Button>
      {rainToSError && <p className="text-ualert-500 mt-2">{rainToSError}</p>}
    </AccordionItem>,
  ];

  return (
    <>
      <FormCard title="Register Account">
        <Accordion
          showDivider={false}
          className="p-2 flex flex-col gap-1 w-full"
          variant="shadow"
          itemClasses={itemClasses}
        >
          {accordionItems}
        </Accordion>
        <div className="flex justify-between mt-4">
          <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            isDisabled={!isBridgeToSAccepted && !isRainToSAccepted && !isOTPVerified}
            className="text-notpurple-500"
            variant="solid"
            onClick={handleKYB}
          >
            Finish KYB
          </Button>
        </div>
      </FormCard>
      <OTPVerificationModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        onVerified={handleOTPVerified}
        email={email}
      />
    </>
  );
};
