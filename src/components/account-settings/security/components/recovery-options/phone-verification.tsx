"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { InputOtp } from "@nextui-org/input-otp";
import { Chip } from "@nextui-org/chip";
import { Phone, XIcon } from "lucide-react";
import { PhoneVerificationProps } from "../../types";
import { formatPhoneNumber } from "@/utils/helpers";

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
        <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-default-500" />
            <span>{configuredPhone.number}</span>
            {configuredPhone.isVerified ? (
              <Chip size="sm" variant="flat" color="success">
                Verified
              </Chip>
            ) : configuredPhone.number === verifyingPhone ? (
              <Chip size="sm" variant="flat" color="warning">
                Verifying
              </Chip>
            ) : (
              <Chip size="sm" variant="flat" color="warning">
                Pending
              </Chip>
            )}
          </div>
          {configuredPhone.isVerified && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onClick={onRemovePhone}
              isDisabled={configuredPhone.number === verifyingPhone}
            >
              <XIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {verifyingPhone && (
        <div className="space-y-2">
          <p className="text-sm text-default-400">Enter the verification code sent to {verifyingPhone}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:flex-1">
              <InputOtp
                length={6}
                value={phoneOtpValue}
                onValueChange={onPhoneOtpChange}
                classNames={{
                  base: "w-full",
                  input: "h-[40px]",
                }}
              />
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                className="flex-1 sm:flex-initial"
                color="danger"
                variant="light"
                onClick={onCancelPhoneVerification}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-initial"
                color="primary"
                onClick={onVerifyPhoneOtp}
                isDisabled={phoneOtpValue.length !== 6}
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
            placeholder="Enter your phone number"
            type="tel"
            value={currentPhone}
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
            onChange={(e) => onPhoneChange(formatPhoneNumber(e.target.value))}
            description={
              <span className="text-xs text-warning-500">
                Phone recovery is susceptible to SIM swap attacks. Use with caution. This is the least secure recovery
                option.
              </span>
            }
            classNames={{
              base: "flex-1",
              inputWrapper: "h-[40px]",
            }}
          />
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            color="primary"
            onClick={() => onAddPhone(currentPhone)}
            isDisabled={!currentPhone}
          >
            Add Phone
          </Button>
        </div>
      )}
    </div>
  );
};
