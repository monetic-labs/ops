"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";
import { Divider } from "@nextui-org/divider";
import { FileText, CreditCard, Building, Users, Clock, Shield, ExternalLink } from "lucide-react";

import { useMediaQuery } from "@/hooks/onboard/useMediaQuery";
import { useTheme } from "@/hooks/generics/useTheme";

interface RequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequirementsModal = ({ isOpen, onClose }: RequirementsModalProps) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { isDark } = useTheme();

  const requirements = [
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "Business Documentation",
      description: "EIN, business registration documents, and tax ID information",
    },
    {
      icon: <Building className="w-5 h-5 text-primary" />,
      title: "Company Information",
      description: "Legal business name, address, website, and business description",
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "Owner & Representative Details",
      description: "Full legal names, contact information, SSN, and date of birth for all owners and representatives",
    },
    {
      icon: <CreditCard className="w-5 h-5 text-primary" />,
      title: "Banking Information",
      description: "You'll need to set up a settlement account for receiving funds",
    },
    {
      icon: <Clock className="w-5 h-5 text-primary" />,
      title: "Time Commitment",
      description: "This process takes approximately 10-15 minutes to complete",
    },
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "Security Setup",
      description: "You'll create a passkey for secure account access using your device's biometrics",
    },
  ];

  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-content1 backdrop-blur-xl border border-border shadow-2xl max-w-[95vw] mx-auto",
        wrapper: "p-1 sm:p-4",
        body: "overflow-hidden",
      }}
      isDismissable={false}
      isOpen={isOpen}
      scrollBehavior="inside"
      size={isMobile ? "md" : "2xl"}
      onClose={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-3 sm:px-6 pt-3 sm:pt-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Before You Begin</h2>
              <p className="text-xs sm:text-sm text-foreground/70 font-normal">
                Please ensure you have the following information ready before proceeding with your account setup
              </p>
            </ModalHeader>
            <ModalBody className="px-3 sm:px-6 py-2 sm:py-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-4 rounded-lg w-full border ${
                      isDark ? "bg-content2/50 border-content3/20" : "bg-content2/30 border-content3/10"
                    }`}
                  >
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full shrink-0">{req.icon}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground text-sm sm:text-base break-words">{req.title}</h3>
                      <p className="text-xs sm:text-sm text-foreground/60 break-words">{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Divider className="my-2 sm:my-4" />

              <div
                className={`border rounded-lg p-2 sm:p-4 w-full ${
                  isDark ? "bg-warning/10 border-warning/20" : "bg-warning/5 border-warning/15"
                }`}
              >
                <h3 className="font-medium text-warning-600 mb-1 sm:mb-2 text-sm sm:text-base">Important Notice</h3>
                <p className="text-xs sm:text-sm text-foreground/70 break-words">
                  To comply with financial regulations, we are required to collect and verify certain information about
                  your business and its beneficial owners. All information provided will be securely stored and used
                  only for compliance purposes.
                </p>
              </div>

              <div
                className={`mt-3 sm:mt-4 border rounded-lg p-2 sm:p-4 w-full ${
                  isDark ? "bg-primary/5 border-primary/10" : "bg-primary/5 border-primary/15"
                }`}
              >
                <h3 className="font-medium text-primary mb-1 sm:mb-2 text-sm sm:text-base flex items-center gap-1">
                  Additional Documents Required <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </h3>
                <p className="text-xs sm:text-sm text-foreground/70 mb-2 break-words">
                  After completing this onboarding process, you will need to have these documents ready:
                </p>
                <ul className="list-disc pl-4 text-xs sm:text-sm text-foreground/70 space-y-1">
                  <li className="break-words">
                    Document confirming the company&apos;s legal existence (e.g., certificate of incorporation or a
                    recent excerpt from a state company registry)
                  </li>
                  <li className="break-words">Document identifying the company&apos;s beneficial owners</li>
                </ul>
                <p className="text-xs sm:text-sm text-foreground/70 mt-2 break-words">
                  For more information, you can refer to the{" "}
                  <a
                    className="text-primary underline inline-flex items-center gap-0.5 hover:text-primary-500"
                    href="https://support.sumsub.com/business-verification/business-verification-overview"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    business verification guide
                    <ExternalLink className="w-3 h-3 inline shrink-0" />
                  </a>
                </p>
              </div>

              <div className="mt-2 sm:mt-4 w-full">
                <Checkbox
                  classNames={{
                    label: "text-xs sm:text-sm break-words text-foreground/80",
                    wrapper: "before:border-2",
                    base: "max-w-full",
                  }}
                  color="primary"
                  isSelected={acknowledged}
                  size="md"
                  onValueChange={setAcknowledged}
                >
                  I have all the required information and am ready to proceed with the account setup process.
                </Checkbox>
              </div>
            </ModalBody>
            <ModalFooter className="px-3 sm:px-6 py-3 sm:py-4">
              <Button
                className="w-full font-medium"
                color="primary"
                isDisabled={!acknowledged}
                size={isMobile ? "md" : "lg"}
                onPress={onClose}
              >
                Continue to Account Setup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
