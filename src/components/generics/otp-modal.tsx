import React, { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { VerifyOTP } from "@backpack-fux/pylon-sdk";
import { useVerifyOTP } from "@/hooks/auth/useOTP";
import { useIssueOTP } from "@/hooks/auth/useOTP";
import { OTP_CODE_LENGTH } from "@/utils/constants";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ isOpen, onClose, onVerified, email }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const { issueOTP, isLoading: isIssueLoading } = useIssueOTP();
  const { verifyOTP, isLoading: isVerifyLoading } = useVerifyOTP();

  useEffect(() => {
    if (isOpen) {
      handleIssueOTP();
    }
  }, [isOpen]);

  const handleIssueOTP = async () => {
    try {
      await issueOTP(email);
      setError("");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = otp.split("");
    newOtp[index] = value;
    const updatedOtp = newOtp.join("");
    setOtp(updatedOtp);

    if (value !== "" && index < OTP_CODE_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (updatedOtp.length === OTP_CODE_LENGTH) {
      setIsOtpComplete(true);
      handleVerify(updatedOtp);
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async (otpValue: string) => {
    try {
      const verified = await verifyOTP({ email, otp: otpValue });
      if (verified) {
        onVerified();
        onClose();
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setOtp("");
    otpInputs.current[0]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    if (pasteData.length === OTP_CODE_LENGTH) {
      setOtp(pasteData);
      pasteData.split("").forEach((char, i) => {
        if (otpInputs.current[i]) {
          otpInputs.current[i]!.value = char;
        }
      });
      handleVerify(pasteData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Verify Email</ModalHeader>
        <ModalBody>
          <p>Please enter the OTP sent to {email}</p>
          <div className="flex justify-center space-x-2">
            {Array.from({ length: OTP_CODE_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpInputs.current[index] = el;
                }}
                className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
                  ${isOtpComplete ? "animate-flash border-ualert-500" : "border-gray-300"}
                  focus:border-ualert-500 focus:outline-none`}
                maxLength={1}
                type="text"
                value={otp[index] || ""}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[index] && index > 0) {
                    otpInputs.current[index - 1]?.focus();
                  }
                }}
                onPaste={handlePaste}
              />
            ))}
          </div>
          {error && <p className="text-ualert-500 mt-2">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button className="text-notpurple-500" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button className="bg-ualert-500" onPress={handleIssueOTP} isLoading={isIssueLoading}>
            Resend OTP
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
