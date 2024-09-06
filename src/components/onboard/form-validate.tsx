import React from "react";
import { Button } from "@nextui-org/button";

import { otpConfig } from "@/config/otp";
import { MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

interface ValidateProps {
  otp: string;
  isOtpComplete: boolean;
  otpSubmitted: boolean;
  otpInputs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleCancel: () => void;
  handleResendOTP: () => void;
  onSubmitStep: (step: number) => void;
  stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
  isIssueLoading: boolean;
  issueError: string | boolean;
  verifyError: string | boolean;
  createMerchant: (data: MerchantCreateInput) => Promise<{
    success: boolean;
    data: MerchantCreateOutput | null;
    error: string | null;
  }>;
  isCreatingMerchant: boolean;
  createMerchantData: MerchantCreateOutput | null;
  createMerchantError: any;
}

export const Validate: React.FC<ValidateProps> = ({
  otp,
  isOtpComplete,
  otpSubmitted,
  otpInputs,
  handleOtpChange,
  handleCancel,
  handleResendOTP,
  onSubmitStep,
  stepCompletion,
  isIssueLoading,
  issueError,
  verifyError,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-notpurple-100">Enter the 6-digit OTP sent to your email.</p>
      <div className="flex flex-col items-center py-10">
        <div className="flex justify-center space-x-6">
          {Array.from({ length: otpConfig.length }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                otpInputs.current[index] = el;
              }}
              className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
                ${
                  isOtpComplete
                    ? "animate-flash border-ualert-500"
                    : otpSubmitted
                    ? "border-green-500"
                    : "border-gray-300"
                }
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
            />
          ))}
        </div>
        {otpSubmitted && <p className="text-notpurple-500 mt-2">OTP submitted</p>}
      </div>

      {(issueError || verifyError) && <p className="text-ualert-500 mt-2">{issueError || verifyError}</p>}
      <div className="flex justify-between mt-4">
        <div className="flex space-x-2">
          <Button className="text-notpurple-500 hover:bg-ualert-500" variant="light" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="text-notpurple-500 hover:bg-ualert-900"
            disabled={isIssueLoading}
            variant="light"
            onClick={handleResendOTP}
          >
            Resend OTP
          </Button>
        </div>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step1 && !stepCompletion.step2 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step1 && !stepCompletion.step2}
          onClick={() => onSubmitStep(3)}
        >
          Complete Validation
        </Button>
      </div>
    </div>
  );
};
