import React, { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { InputOtp } from "@nextui-org/input-otp";

import { useOTP } from "@/hooks/auth/useOTP";
import { OTP_CODE_LENGTH } from "@/utils/constants";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ isOpen, onClose, onVerified, email }) => {
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { issueOTP, verifyOTP, isLoading, error: otpError, otp, setOTP, resetState } = useOTP(otpInputRef);

  useEffect(() => {
    let mounted = true;

    if (isOpen && mounted) {
      issueOTP(email);
    }

    return () => {
      mounted = false;
      resetState();
    };
  }, [isOpen, email, issueOTP, resetState]);

  const handleVerify = async () => {
    const success = await verifyOTP({ email, otp });
    if (success) {
      onVerified();
      resetState();
    }
  };

  return (
    <Modal data-testid="otp-modal" isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Enter OTP</ModalHeader>
        <ModalBody>
          <InputOtp
            ref={otpInputRef}
            length={OTP_CODE_LENGTH}
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOTP(e.target.value)}
            onValueChange={setOTP}
            onComplete={handleVerify}
            size="lg"
            variant="faded"
            classNames={{
              input: "w-10 h-12 text-center text-xl text-white",
              base: "flex justify-center space-x-2",
            }}
            isDisabled={isLoading}
            errorMessage={otpError}
            isInvalid={otpError !== null}
            data-testid="otp-input-container"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isLoading} onPress={handleVerify}>
            Verify
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
