"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { InputOtp } from "@nextui-org/input-otp";
import { Chip } from "@nextui-org/chip";
import { Phone, XIcon } from "lucide-react";

import { formatPhoneNumber } from "@/utils/helpers";

import { PhoneVerificationProps } from "../../types";

export const PhoneVerification = ({
  configuredPhone,
  currentPhone,
  verifyingPhone,
  phoneOtpValue,
  onAddPhone,
  onVerifyPhoneOtp,
  onCancelPhoneVerification,
  onRemovePhone,
  onPhoneChange,
  onPhoneOtpChange,
}: PhoneVerificationProps) => {
  return (
    <div className="space-y-4">
      {configuredPhone && (
        <div className="flex items-center justify-between p-3 bg-content2 rounded-lg">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-foreground/60" />
            <span>{formatPhoneNumber(configuredPhone.number.slice(1), configuredPhone.number.slice(0, 1))}</span>
            {configuredPhone.isVerified ? (
              <Chip className="bg-teal-500/10 text-teal-500" size="sm" variant="flat">
                Verified
              </Chip>
            ) : configuredPhone.number === verifyingPhone ? (
              <Chip className="bg-amber-500/10 text-amber-500" size="sm" variant="flat">
                Verifying
              </Chip>
            ) : (
              <Chip className="bg-amber-500/10 text-amber-500" size="sm" variant="flat">
                Pending
              </Chip>
            )}
          </div>
          {configuredPhone.isVerified && (
            <Button
              isIconOnly
              className="text-red-500 hover:text-red-600"
              isDisabled={configuredPhone.number === verifyingPhone}
              size="sm"
              variant="light"
              onClick={onRemovePhone}
            >
              <XIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {verifyingPhone && (
        <div className="space-y-2">
          <p className="text-sm text-foreground/60">Enter the verification code sent to {verifyingPhone}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:flex-1">
              <InputOtp
                classNames={{
                  base: "w-full",
                  input: "h-[40px]",
                }}
                length={6}
                value={phoneOtpValue}
                onValueChange={onPhoneOtpChange}
              />
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                className="flex-1 sm:flex-initial text-red-500"
                variant="light"
                onClick={onCancelPhoneVerification}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-initial bg-teal-500 text-white hover:bg-teal-600"
                isDisabled={phoneOtpValue.length !== 6}
                onClick={onVerifyPhoneOtp}
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {!verifyingPhone && !configuredPhone && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            classNames={{
              base: "flex-1",
              inputWrapper: "h-[40px]",
            }}
            description={
              <span className="text-xs text-warning-500">
                Phone recovery is susceptible to SIM swap attacks. Use with caution. This is the least secure recovery
                option.
              </span>
            }
            placeholder="Enter your phone number"
            startContent={
              <div className="flex items-center">
                <label className="sr-only" htmlFor="phone-extension-code">
                  Phone Extension Code
                </label>
                <select
                  className="outline-none border-0 bg-transparent text-default-400 text-small"
                  id="phone-extension-code"
                  name="phone-extension-code"
                >
                  <option>+1</option>
                  <option>+33</option>
                  <option>+34</option>
                  <option>+39</option>
                  <option>+41</option>
                  <option>+44</option>
                  <option>+49</option>
                  <option>+52</option>
                  <option>+54</option>
                  <option>+55</option>
                  <option>+61</option>
                </select>
              </div>
            }
            type="tel"
            value={currentPhone}
            onChange={(e) => onPhoneChange(formatPhoneNumber(e.target.value))}
          />
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            color="primary"
            isDisabled={!currentPhone}
            onClick={() => onAddPhone(currentPhone)}
          >
            Add Phone
          </Button>
        </div>
      )}
    </div>
  );
};
