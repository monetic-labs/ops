"use client";

import React, { useRef, useState, MouseEvent, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { InputOtp } from "@nextui-org/input-otp";

import { PressEvent } from "@react-types/shared";

import { useOTP } from "@/hooks/auth/useOTP";
import Notification from "@/components/generics/notification";
import { title, subtitle } from "@/components/primitives";
import { OTP_CODE_LENGTH as OTP_LENGTH } from "@/utils/constants";
import { isLocal, isTesting } from "@/utils/helpers";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const {
    issueOTP,
    verifyOTP,
    isLoading,
    error: otpError,
    otpSent,
    resetState: resetOTPState,
    otp,
    setOTP,
  } = useOTP(otpInputRef);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const shouldEnableTimer = !isLocal && !isTesting;

  const handleSignUp = async (e: MouseEvent) => {
    e.preventDefault();
    router.push(`/onboard?email=${encodeURIComponent(email)}`);
  };

  const handleLogin = async (e: PressEvent) => {
    try {
      const response = await issueOTP(email);
      if (response === 200) {
        setShowOtpInput(true);
        if (shouldEnableTimer) {
          setCanResend(false);
          setResendTimer(30);
        }
      }
    } catch (error: any) {
      console.error("Error issuing OTP:", error);
      if (error.statusCode === 404) {
        setNotification("New User Detected. Redirecting to registration...");
        setTimeout(() => {
          setNotification(null);
          router.push(`/onboard?email=${encodeURIComponent(email)}`);
        }, 3000);
      }
    }
  };

  const handleVerify = async (otpValue?: string) => {
    const valueToVerify = otpValue || otp;
    if (email && valueToVerify.length === OTP_LENGTH) {
      const success = await verifyOTP({ email, otp: valueToVerify });
      if (success) {
        router.refresh();
      }
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    resetOTPState();
  };

  const handleResendOTP = async () => {
    if (email && canResend) {
      if (shouldEnableTimer) {
        setCanResend(false);
        setResendTimer(30);
      }
      resetOTPState();
      await issueOTP(email);
    }
  };

  useEffect(() => {
    if (otpSent) {
      setShowOtpInput(true);
    }
  }, [otpSent]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 px-4 max-w-3xl mx-auto">
      <h1 className={title({ color: "chardient" })}>Self Banking Portal</h1>
      <h2 className={subtitle({ color: "charyo" })}>Welcome, Skeptic</h2>
      <div className="bg-background/60 backdrop-blur-md rounded-lg p-6 shadow-lg w-full max-w-md">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
            <Spinner size="lg" />
          </div>
        )}
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
              <div className="flex flex-col items-center justify-center">
                <InputOtp
                  ref={otpInputRef}
                  length={OTP_LENGTH}
                  value={otp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOTP(e.target.value)}
                  onValueChange={setOTP}
                  onComplete={handleVerify}
                  size={window.innerWidth < 640 ? "sm" : "lg"}
                  variant="faded"
                  classNames={{
                    input: "w-10 h-12 text-center text-xl text-white",
                    base: "flex justify-center space-x-2",
                  }}
                  isDisabled={isLoading}
                  errorMessage={otpError}
                  isInvalid={otpError !== null}
                  data-testid="otp-input-container"
                />
              </div>
              <div className="flex gap-2 justify-between">
                <Button
                  className="bg-notpurple-500/30 text-white hover:bg-gray-600"
                  type="button"
                  variant="flat"
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-ualert-500 text-white hover:bg-ualert-600"
                  data-testid="resend-otp-button"
                  type="button"
                  variant="flat"
                  onPress={handleResendOTP}
                  isDisabled={isLoading || (!canResend && shouldEnableTimer)}
                >
                  {!canResend && shouldEnableTimer ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </Button>
              </div>
            </>
          )}
          {!showOtpInput && (
            <div className="flex gap-2">
              <Button
                className="bg-charyo-500 text-white hover:bg-notpurple-600 flex-1"
                data-testid="sign-up-button"
                type="submit"
                variant="shadow"
                onClick={handleSignUp}
              >
                Sign Up
              </Button>
              <Button
                className="bg-ualert-500 text-white hover:bg-notpurple-600 flex-1"
                data-testid="sign-in-button"
                isLoading={isLoading}
                type="button"
                variant="shadow"
                isDisabled={!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z0-9]{2,}$/i.test(email)}
                onPress={handleLogin}
              >
                Sign In
              </Button>
            </div>
          )}
        </form>
      </div>
      {notification && <Notification message={notification} />}
    </section>
  );
}
