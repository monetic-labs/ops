"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { InputOtp } from "@nextui-org/input-otp";
import { RefObject, ChangeEvent } from "react";

import { OTP_CODE_LENGTH } from "@/utils/constants";

interface OTPModalProps {
  isOpen: boolean;
  email: string;
  otp: string;
  otpError: string | null;
  isLoading: boolean;
  canResend: boolean;
  resendTimer: number;
  shouldEnableTimer: boolean;
  otpInputRef: RefObject<HTMLInputElement>;
  onOTPChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOTPComplete: () => void;
  onResend: () => void;
  onValueChange: (value: string) => void;
  onClose?: () => void;
}

export function OTPModal({
  isOpen,
  email,
  otp,
  otpError,
  isLoading,
  canResend,
  resendTimer,
  shouldEnableTimer,
  otpInputRef,
  onOTPChange,
  onOTPComplete,
  onResend,
  onValueChange,
  onClose,
}: OTPModalProps) {
  return (
    <Modal
      classNames={{
        base: "bg-background/80 backdrop-blur-md",
        body: "py-6",
      }}
      hideCloseButton={!onClose}
      isDismissable={!!onClose}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <h2 className="text-2xl font-bold">Verify Your Email</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-6">
            <p className="text-default-500 text-center">
              We&apos;ve sent a verification code to {email}. Please enter it below to complete your registration.
            </p>
            <InputOtp
              ref={otpInputRef}
              classNames={{
                input: "w-12 h-12 text-center text-xl text-white",
                base: "flex justify-center gap-2",
              }}
              data-testid="otp-input-container"
              errorMessage={otpError}
              isDisabled={isLoading}
              isInvalid={!!otpError}
              length={OTP_CODE_LENGTH}
              size="lg"
              value={otp}
              variant="bordered"
              onChange={onOTPChange}
              onComplete={onOTPComplete}
              onValueChange={onValueChange}
            />
          </div>
        </ModalBody>
        {onClose && (
          <ModalFooter className="flex justify-between w-full pt-0">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={isLoading || (!canResend && shouldEnableTimer)}
              variant="light"
              onPress={onResend}
            >
              {!canResend && shouldEnableTimer ? `Resend in ${resendTimer}s` : "Resend Code"}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
