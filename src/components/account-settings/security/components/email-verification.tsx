"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { InputOtp } from "@nextui-org/input-otp";
import { Chip } from "@nextui-org/chip";
import { Mail, XIcon } from "lucide-react";
import { EmailVerificationProps } from "../types";

export const EmailVerification = ({
  configuredEmails,
  currentEmail,
  verifyingEmail,
  otpValue,
  onAddEmail,
  onVerifyOtp,
  onCancelVerification,
  onRemoveEmail,
  onEmailChange,
  onOtpChange,
}: EmailVerificationProps) => {
  return (
    <div className="space-y-4">
      {configuredEmails.length > 0 && (
        <div className="space-y-2">
          {configuredEmails.map((email) => (
            <div key={email.email} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-default-500" />
                <span>{email.email}</span>
                {email.isVerified ? (
                  <Chip size="sm" variant="flat" color="success">
                    Verified
                  </Chip>
                ) : email.email === verifyingEmail ? (
                  <Chip size="sm" variant="flat" color="warning">
                    Verifying
                  </Chip>
                ) : (
                  <Chip size="sm" variant="flat" color="warning">
                    Pending
                  </Chip>
                )}
              </div>
              {email.isVerified && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onClick={() => onRemoveEmail(email.email)}
                  isDisabled={email.email === verifyingEmail}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {verifyingEmail && (
        <div className="space-y-2">
          <p className="text-sm text-default-400">Enter the verification code sent to {verifyingEmail}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:flex-1">
              <InputOtp
                length={6}
                value={otpValue}
                onValueChange={onOtpChange}
                classNames={{
                  base: "w-full",
                  input: "h-[40px]",
                }}
              />
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button className="flex-1 sm:flex-initial" color="danger" variant="light" onClick={onCancelVerification}>
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-initial"
                color="primary"
                onClick={onVerifyOtp}
                isDisabled={otpValue.length !== 6}
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {!verifyingEmail && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Enter your email address"
            type="email"
            value={currentEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            description="For enhanced security, use emails of trusted friends and family."
            classNames={{
              base: "flex-1",
              inputWrapper: "h-[40px]",
            }}
          />
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            color="primary"
            onClick={() => onAddEmail(currentEmail)}
            isDisabled={!currentEmail || configuredEmails.some((e) => e.email === currentEmail)}
          >
            Add Email
          </Button>
        </div>
      )}
    </div>
  );
};
