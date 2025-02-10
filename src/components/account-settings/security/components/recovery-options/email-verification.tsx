"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { InputOtp } from "@nextui-org/input-otp";
import { Chip } from "@nextui-org/chip";
import { Mail, XIcon } from "lucide-react";

import { EmailVerificationProps } from "../../types";

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
  pendingDeletions = [],
}: EmailVerificationProps) => {
  return (
    <div className="space-y-4">
      {configuredEmails.length > 0 && (
        <div className="space-y-2">
          {configuredEmails
            .filter((email) => !pendingDeletions.includes(email.recoveryWalletId || ""))
            .map((email) => (
              <div key={email.email} className="flex items-center justify-between p-3 bg-content2 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-foreground/60" />
                  <span>{email.email}</span>
                  {email.isVerified ? (
                    <Chip color="success" size="sm" variant="flat">
                      Verified
                    </Chip>
                  ) : email.email === verifyingEmail ? (
                    <Chip color="warning" size="sm" variant="flat">
                      Verifying
                    </Chip>
                  ) : (
                    <Chip color="warning" size="sm" variant="flat">
                      Pending
                    </Chip>
                  )}
                </div>
                {email.isVerified && (
                  <Button
                    isIconOnly
                    color="danger"
                    isDisabled={email.email === verifyingEmail}
                    size="sm"
                    variant="light"
                    onClick={() => onRemoveEmail(email.email)}
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
          <p className="text-sm text-foreground/60">Enter the verification code sent to {verifyingEmail}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:flex-1">
              <InputOtp
                classNames={{
                  base: "w-full",
                  input: "h-[40px]",
                }}
                length={6}
                value={otpValue}
                onValueChange={onOtpChange}
              />
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button className="flex-1 sm:flex-initial" color="danger" variant="light" onClick={onCancelVerification}>
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-initial"
                color="primary"
                isDisabled={otpValue.length !== 6}
                onClick={onVerifyOtp}
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
            classNames={{
              base: "flex-1",
              inputWrapper: "h-[40px]",
            }}
            description="For enhanced security, use emails of trusted friends and family."
            placeholder="Enter your email address"
            type="email"
            value={currentEmail}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            color="primary"
            isDisabled={!currentEmail || configuredEmails.some((e) => e.email === currentEmail)}
            onClick={() => onAddEmail(currentEmail)}
          >
            Add Email
          </Button>
        </div>
      )}
    </div>
  );
};
