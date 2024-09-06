"use client";

import React, { useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useRouter } from "next/navigation";

import { useIssueOTP, useVerifyOTP } from "@/hooks/auth/useOTP";
import { title, subtitle } from "@/components/primitives";
import { OTP_CODE_LENGTH as OTP_LENGTH } from "@/utils/constants";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const { issueOTP, isLoading: isIssueLoading, error: issueError } = useIssueOTP();
  const { verifyOTP, isLoading: isVerifyLoading, error: verifyError } = useVerifyOTP();
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/onboard?email=${encodeURIComponent(email)}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const response = await issueOTP(email);

      if (response) {
        setShowOtpInput(true);
        // In a real-world scenario, you wouldn't display the OTP to the user
        // This is just for demonstration purposes
        console.log("OTP issued:", response ? email : "Failed to issue OTP");
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = otp.split("");

    newOtp[index] = value;
    const updatedOtp = newOtp.join("");

    setOtp(updatedOtp);

    if (value !== "" && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (updatedOtp.length === OTP_LENGTH) {
      console.log("6th digit entered:", updatedOtp);
      setIsOtpComplete(true);
      setTimeout(() => setIsOtpComplete(false), 1000); // Reset after 1 second
      handleVerify(updatedOtp);
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async (otpValue: string) => {
    if (email && otpValue.length === OTP_LENGTH) {
      setOtpSubmitted(true);
      const response = await verifyOTP({ email, otp: otpValue });

      if (response) {
        // Handle successful verification (e.g., redirect to dashboard)
        console.log("OTP verified successfully");
        router.push("/dashboard");
      }
      // Clear OTP after verification
      setOtp("");
      // Reset focus to first input
      otpInputs.current[0]?.focus();
      // Reset otpSubmitted after a delay to show the visual feedback
      setTimeout(() => setOtpSubmitted(false), 2000);
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
    setOtpSubmitted(false);
  };

  const handleResendOTP = async () => {
    if (email) {
      await issueOTP(email);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");

    if (pasteData.length === OTP_LENGTH) {
      const newOtp = pasteData.split("");

      setOtp(newOtp.join(""));

      newOtp.forEach((char, i) => {
        otpInputs.current[i]?.focus();
      });

      if (newOtp.length === OTP_LENGTH) {
        setIsOtpComplete(true);
        setTimeout(() => setIsOtpComplete(false), 1000); // Reset after 1 second
        handleVerify(newOtp.join(""));
      } else {
        setIsOtpComplete(false);
      }
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 px-4 max-w-3xl mx-auto">
      <h1 className={title({ color: "chardient" })}>Self Banking Portal</h1>
      <h2 className={subtitle({ color: "charyo" })}>Welcome, Skeptic</h2>
      <div className="bg-background/60 backdrop-blur-md rounded-lg p-6 shadow-lg w-full max-w-md">
        <form className="space-y-4">
          <Input
            required
            label="Email"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {showOtpInput && (
            <>
              <div className="flex justify-center space-x-2">
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputs.current[index] = el;
                    }}
                    className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
        ${isOtpComplete ? "animate-flash border-ualert-500" : otpSubmitted ? "border-green-500" : "border-gray-300"}
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
              <div className="flex gap-2 justify-between">
                <Button
                  className="bg-notpurple-500/30 text-white hover:bg-gray-600"
                  type="button"
                  variant="flat"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-ualert-500 text-white hover:bg-ualert-600"
                  isLoading={isIssueLoading}
                  type="button"
                  variant="flat"
                  onClick={handleResendOTP}
                >
                  Resend OTP
                </Button>
              </div>
            </>
          )}
          {!showOtpInput && (
            <div className="flex gap-2">
              <Button
                className="bg-charyo-500 text-white hover:bg-notpurple-600 flex-1"
                type="submit"
                variant="shadow"
                onClick={handleSignUp}
              >
                Sign Up
              </Button>
              <Button
                className="bg-ualert-500 text-white hover:bg-notpurple-600 flex-1"
                isLoading={isIssueLoading}
                type="button"
                variant="shadow"
                onClick={handleLogin}
              >
                Sign In
              </Button>
            </div>
          )}
        </form>
        {(issueError || verifyError) && <p className="!text-ualert-500 mt-2">{issueError || verifyError}</p>}
      </div>
    </section>
  );
}
