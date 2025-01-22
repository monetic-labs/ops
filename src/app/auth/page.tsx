"use client";

import React, { useRef, useState, MouseEvent, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { InputOtp } from "@nextui-org/input-otp";
import { PressEvent } from "@react-types/shared";
import { useOTP } from "@/hooks/auth/useOTP";
import Notification from "@/components/generics/notification";
import { title, subtitle } from "@/components/primitives";
import { OTP_CODE_LENGTH as OTP_LENGTH } from "@/utils/constants";
import { isLocal, isTesting } from "@/utils/helpers";
import { MetaTransaction } from "abstractionkit";
import { WebAuthnHelper } from "@/utils/webauthn";
import { SafeAccountHelper } from "@/utils/safeAccount";

// App constants
const APP_NAME = "Backpack Staging";
import { OTPModal } from "@/components/generics/otp-modal";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams?.get("invite") || null);
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

  useEffect(() => {
    const inviteEmail = searchParams?.get("invite");
    if (inviteEmail) {
      setEmail(inviteEmail);
      handleLogin();
    }
  }, [searchParams]);

  const handleSignUp = async (e: MouseEvent) => {
    e.preventDefault();

      // // Step 1: Initialize WebAuthn and create passkey
      // const webauthnHelper = new WebAuthnHelper();
      // const { publicKeyCoordinates } = await webauthnHelper.createPasskey(APP_NAME, window.location.hostname);

      // // Step 2: Initialize Safe account
      // const safeHelper = new SafeAccountHelper(publicKeyCoordinates);
      // const accountAddress = safeHelper.getAddress();

      // // Step 3: Create and sponsor deployment transaction
      // const deploymentTx: MetaTransaction = {
      //   to: accountAddress,
      //   value: BigInt(0),
      //   data: "0x",
      // };
      // const userOperation = await safeHelper.createSponsoredUserOp(deploymentTx);

      // // Step 4: Sign and send the user operation
      // const userOpHash = safeHelper.getUserOpHash(userOperation);
      // const signature = await webauthnHelper.signMessage(userOpHash);
      // const receipt = await safeHelper.signAndSendUserOp(userOperation, signature);

      // console.log("Account created successfully:", {
      //   address: accountAddress,
      //   receipt,
      // });

      // return receipt;

    // if (email) {
    //   router.push(`/onboard?email=${encodeURIComponent(email)}`);
    // } else {
    //   router.push(`/onboard`);
    // }
  };

  const handleLogin = async () => {
    try {
      // TODO: login with passkey
      if (!email) {
        setNotification("Please enter an email address");
        return;
      }
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
          if (email) {
            router.push(`/onboard?email=${encodeURIComponent(email)}`);
          } else {
            router.push(`/onboard`);
          }
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
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
          />
          {showOtpInput && (
            <OTPModal
              isOpen={showOtpInput}
              email={email || ""}
              otp={otp}
              otpError={otpError}
              isLoading={isLoading}
              canResend={canResend}
              resendTimer={resendTimer}
              shouldEnableTimer={shouldEnableTimer}
              otpInputRef={otpInputRef}
              onOTPChange={(e) => setOTP(e.target.value)}
              onOTPComplete={handleVerify}
              onResend={handleResendOTP}
              onValueChange={setOTP}
              onClose={handleCancel}
            />
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
                isDisabled={!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z0-9]{2,}$/i.test(email)}
                isLoading={isLoading}
                type="button"
                variant="shadow"
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
