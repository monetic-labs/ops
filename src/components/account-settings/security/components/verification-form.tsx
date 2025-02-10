"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { InputOtp } from "@nextui-org/input-otp";
import { Chip } from "@nextui-org/chip";
import { LucideIcon, XIcon } from "lucide-react";

type VerificationItem = {
  identifier: string;
  isVerified: boolean;
  recoveryWalletId?: string;
};

type VerificationFormProps = {
  type: "email" | "phone";
  icon: LucideIcon;
  items: VerificationItem[];
  currentValue: string;
  verifyingValue: string | null;
  otpValue: string;
  placeholder: string;
  description?: string;
  inputStartContent?: React.ReactNode;
  onAdd: (value: string) => void;
  onVerifyOtp: () => void;
  onCancelVerification: () => void;
  onRemove: (identifier: string) => void;
  onValueChange: (value: string) => void;
  onOtpChange: (otp: string) => void;
  pendingDeletions?: string[];
  maxItems?: number;
};

export const VerificationForm = ({
  type,
  icon: Icon,
  items,
  currentValue,
  verifyingValue,
  otpValue,
  placeholder,
  description,
  inputStartContent,
  onAdd,
  onVerifyOtp,
  onCancelVerification,
  onRemove,
  onValueChange,
  onOtpChange,
  pendingDeletions = [],
  maxItems = Infinity,
}: VerificationFormProps) => {
  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="space-y-2">
          {items
            .filter((item) => !pendingDeletions.includes(item.recoveryWalletId || ""))
            .map((item) => (
              <div key={item.identifier} className="flex items-center justify-between p-3 bg-content2 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-foreground/60" />
                  <span>{item.identifier}</span>
                  {item.isVerified ? (
                    <Chip color="success" size="sm" variant="flat">
                      Verified
                    </Chip>
                  ) : item.identifier === verifyingValue ? (
                    <Chip color="warning" size="sm" variant="flat">
                      Verifying
                    </Chip>
                  ) : (
                    <Chip color="warning" size="sm" variant="flat">
                      Pending
                    </Chip>
                  )}
                </div>
                {item.isVerified && (
                  <Button
                    isIconOnly
                    color="danger"
                    isDisabled={item.identifier === verifyingValue}
                    size="sm"
                    variant="light"
                    onClick={() => onRemove(item.identifier)}
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}

      {verifyingValue && (
        <div className="space-y-2">
          <p className="text-sm text-foreground/60">Enter the verification code sent to {verifyingValue}</p>
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

      {!verifyingValue && items.length < maxItems && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            classNames={{
              base: "flex-1",
              inputWrapper: "h-[40px]",
            }}
            description={description}
            placeholder={placeholder}
            startContent={inputStartContent}
            type={type}
            value={currentValue}
            onChange={(e) => onValueChange(e.target.value)}
          />
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            color="primary"
            isDisabled={!currentValue || items.some((i) => i.identifier === currentValue)}
            onClick={() => onAdd(currentValue)}
          >
            Add {type === "email" ? "Email" : "Phone"}
          </Button>
        </div>
      )}
    </div>
  );
};
