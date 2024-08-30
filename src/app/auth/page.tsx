"use client";

import { title, subtitle } from "@/components/primitives";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useLogin } from "@/hooks/auth/useLogin";
import { useVerify } from "@/hooks/auth/useVerify";
import { useRouter } from "next/navigation";

const OTP_LENGTH = 6;

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const { login, isLoading: isLoginLoading, error: loginError, otpResponse } = useLogin();
  const { verify, isLoading: isVerifyLoading, error: verifyError } = useVerify();
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (otpResponse) {
      setShowOtpInput(true);
      // In a real-world scenario, you wouldn't display the OTP to the user
      // This is just for demonstration purposes
      console.log("OTP received:", otpResponse.otp);
    }
  }, [otpResponse]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/onboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await login(email);
      setShowOtpInput(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);

    if (value !== '' && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (updatedOtp.length === OTP_LENGTH) {
      console.log("6th digit entered:", updatedOtp);
      setIsOtpComplete(true);
      setTimeout(() => setIsOtpComplete(false), 1000); // Reset after 1 second
      handleVerify();
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async () => {
    if (email && otp.length === OTP_LENGTH) {
      setOtpSubmitted(true);
      await verify(email, otp);
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
      await login(email);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 px-4 max-w-3xl mx-auto">
      <h1 className={title({ color: "chardient" })}>Self Banking Portal</h1>
      <h2 className={subtitle({ color: "charyo" })}>Welcome, Skeptic</h2>
      <div className="bg-background/60 backdrop-blur-md rounded-lg p-6 shadow-lg w-full max-w-md">
        <form className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {showOtpInput && (
            <>
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="otp-input" className="text-white">Enter OTP</label>
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          otpInputs.current[index - 1]?.focus();
                        }
                      }}
                      className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
                        ${isOtpComplete ? 'animate-flash border-ualert-500' : otpSubmitted ? 'border-green-500' : 'border-gray-300'}
                        focus:border-ualert-500 focus:outline-none`}
                    />
                  ))}
                </div>
                {otpSubmitted && (
                  <p className="text-notpurple-500 mt-2">OTP submitted</p>
                )}
              </div>
              <div className="flex gap-2 justify-between">
                <Button
                  type="button"
                  className="bg-notpurple-500/30 text-white hover:bg-gray-600"
                  variant="flat"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-ualert-500 text-white hover:bg-ualert-600"
                  variant="flat"
                  onClick={handleResendOTP}
                  isLoading={isLoginLoading}
                >
                  Resend OTP
                </Button>
              </div>
            </>
          )}
          {!showOtpInput && (
            <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-charyo-500 text-white hover:bg-notpurple-600 flex-1"
              variant="shadow"
              onClick={handleSignUp}
            >
              Sign Up
            </Button>
            <Button
              type="button"
              className="bg-ualert-500 text-white hover:bg-notpurple-600 flex-1"
              variant="shadow"
              onClick={handleLogin}
              isLoading={isLoginLoading}
            >
              Sign In
            </Button>
          </div>
          )}
        </form>
        {(loginError || verifyError) && (
          <p className="!text-ualert-500 mt-2">{loginError || verifyError}</p>
        )}
      </div>
    </section>
  );
}
