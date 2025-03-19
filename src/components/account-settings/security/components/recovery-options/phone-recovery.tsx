"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { XIcon } from "lucide-react";

import { formatPhoneNumber } from "@/utils/helpers";

interface PhoneRecoveryProps {
  configuredPhone: { number: string; isVerified: boolean } | null;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  handleAddPhone: () => Promise<void>;
  handleRemovePhone: () => Promise<void>;
}

const PhoneRecovery: React.FC<PhoneRecoveryProps> = ({
  configuredPhone,
  phoneInput,
  setPhoneInput,
  handleAddPhone,
  handleRemovePhone,
}) => {
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-foreground/60 mt-2">
        Your phone number will be used solely for secure account recovery.
      </p>
      {/* Show configured phone */}
      {configuredPhone && (
        <div className="mb-4">
          <div className="flex items-center justify-between bg-default-100 p-2.5 rounded-md">
            <span className="text-sm">{formatPhoneNumber(configuredPhone.number.slice(1), "1")}</span>
            <Button isIconOnly className="min-w-0 h-7 w-7" size="sm" variant="light" onPress={handleRemovePhone}>
              <XIcon size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Add phone form - simplified without verification */}
      {!configuredPhone && (
        <div className="flex gap-2">
          <Input
            className="flex-grow"
            placeholder="Enter your phone number"
            radius="sm"
            size="sm"
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-sm text-default-400">+1</span>
              </div>
            }
            value={phoneInput}
            onChange={(e) => setPhoneInput(formatPhoneNumber(e.target.value))}
          />
          <Button
            className="px-4 bg-teal-600 text-white"
            color="primary"
            isDisabled={!phoneInput}
            radius="sm"
            size="md"
            onPress={handleAddPhone}
          >
            Add Phone
          </Button>
        </div>
      )}

      <p className="text-xs text-warning/60">
        Note: This method is less secure due to potential SIM swap vulnerabilities.
      </p>
    </div>
  );
};

export default PhoneRecovery;
