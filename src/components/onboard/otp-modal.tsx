import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { VerifyOTP } from "@backpack-fux/pylon-sdk";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<VerifyOTP | null>;
  email: string;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ isOpen, onClose, onVerify, email }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    try {
      const verified = await onVerify(otp);

      if (verified) {
        onClose();
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Verify Email</ModalHeader>
        <ModalBody>
          <p>Please enter the OTP sent to {email}</p>
          <Input errorMessage={error} placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button className="text-notpurple-500" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button className="bg-ualert-500" onPress={handleVerify}>
            Verify OTP
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
