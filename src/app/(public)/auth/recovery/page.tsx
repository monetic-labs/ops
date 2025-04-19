"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ArrowLeft, Mail, Phone, Key, Shield, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { OTP_CODE_LENGTH } from "@/utils/constants";

interface RecoveryOptions {
  email: boolean;
  phone: boolean;
  recoveryCode: boolean;
  monetic: boolean;
}

export default function RecoveryPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOptions | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleEmailSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Call pylon SDK to request OTP
      // const response = await pylon.requestRecoveryOTP(email);
      setIsVerifying(true);
    } catch (error) {
      console.error("Email verification error:", error);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Call pylon SDK to verify OTP and get recovery options
      // const response = await pylon.verifyRecoveryOTP(email, otp);
      // setWalletAddress(response.walletAddress);
      // setRecoveryOptions(response.recoveryOptions);

      // Mock response for now
      setRecoveryOptions({
        email: true,
        phone: true,
        recoveryCode: false, // Example of a disabled option
        monetic: true,
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryOption = async (method: keyof RecoveryOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      switch (method) {
        case "email":
          // TODO: Implement email recovery
          break;
        case "phone":
          // TODO: Implement phone recovery
          break;
        case "recoveryCode":
          // TODO: Implement recovery code
          break;
        case "monetic":
          // TODO: Implement monetic support
          break;
      }
    } catch (error) {
      console.error("Recovery error:", error);
      setError("Recovery failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const RecoveryOption = ({
    method,
    icon: Icon,
    title,
    description,
    isEnabled,
  }: {
    method: keyof RecoveryOptions;
    icon: any;
    title: string;
    description: string;
    isEnabled: boolean;
  }) => (
    <button
      className={`w-full p-4 rounded-xl text-left transition-all ${
        isEnabled ? "bg-white/10 hover:bg-white/20 cursor-pointer" : "bg-white/5 cursor-not-allowed opacity-50"
      }`}
      disabled={!isEnabled}
      onClick={() => isEnabled && handleRecoveryOption(method)}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-white/10">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-white/60 text-sm mt-1">{description}</p>
        </div>
        {isEnabled && <ArrowRight className="w-5 h-5 text-white/40 mt-2" />}
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="bg-transparent sm:bg-zinc-800/90 backdrop-blur-xl border-none shadow-none sm:shadow-2xl">
        <CardHeader className="flex flex-col gap-2 p-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <Button isIconOnly className="text-white" variant="light" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Account Recovery</h1>
              <p className="text-white/60 text-sm sm:text-base mt-1">
                Forgot your passkey? No problem. Let&apos;s recover it.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="px-6 pb-6 sm:px-8">
          {/* Warning Message */}
          <div className="mb-8 p-4 rounded-xl bg-ualert-500/10 border border-ualert-500/20">
            <h3 className="text-ualert-500 font-medium mb-2">Important Notice</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>
                Account recovery is an intensive process that should be used sparingly. Before proceeding, consider
                these alternatives:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Use another passkey already registered to your account</li>
                <li>Ask a team administrator to revoke your access and send a new invitation</li>
              </ul>
            </div>
          </div>

          {!isVerifying ? (
            // Email Input Step
            (<div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-white text-lg font-medium">Account Email</h2>
                <p className="text-white/60 text-sm">Enter your account email to start the recovery process.</p>
              </div>
              <Input
                classNames={{
                  input: "text-white text-lg",
                  inputWrapper: "bg-white/10 border-none",
                }}
                placeholder="Enter your account email"
                size="lg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full bg-white/10 hover:bg-white/20 text-white h-12"
                isLoading={isLoading}
                size="lg"
                onClick={handleEmailSubmit}
              >
                Continue
              </Button>
            </div>)
          ) : !recoveryOptions ? (
            // OTP Verification Step
            (<div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-white text-lg font-medium">Verify Your Email</h2>
                <p className="text-white/60 text-sm">We&apos;ve sent a verification code to {email}</p>
              </div>
              <Input
                classNames={{
                  input: "text-white text-lg tracking-widest text-center",
                  inputWrapper: "bg-white/10 border-none",
                }}
                maxLength={OTP_CODE_LENGTH}
                placeholder="Enter 6-digit code"
                size="lg"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button
                className="w-full bg-white/10 hover:bg-white/20 text-white h-12"
                isLoading={isLoading}
                size="lg"
                onClick={handleOTPVerification}
              >
                Verify Email
              </Button>
            </div>)
          ) : (
            // Recovery Options Step
            (<div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-white text-lg font-medium">Recovery Options</h2>
                <p className="text-white/60 text-sm">Select a method to recover your account</p>
              </div>
              <div className="space-y-3">
                <RecoveryOption
                  description="Recover using your verified email address"
                  icon={Mail}
                  isEnabled={recoveryOptions.email}
                  method="email"
                  title="Email Recovery"
                />
                <RecoveryOption
                  description="Use your registered phone number"
                  icon={Phone}
                  isEnabled={recoveryOptions.phone}
                  method="phone"
                  title="Phone Recovery"
                />
                <RecoveryOption
                  description="Use one of your backup recovery codes"
                  icon={Key}
                  isEnabled={recoveryOptions.recoveryCode}
                  method="recoveryCode"
                  title="Recovery Codes"
                />
                <RecoveryOption
                  description="Contact Monetic support for assistance"
                  icon={Shield}
                  isEnabled={recoveryOptions.monetic}
                  method="monetic"
                  title="Monetic Support"
                />
              </div>
            </div>)
          )}

          {error && <div className="mt-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm text-center">{error}</div>}
        </CardBody>
      </Card>
    </div>
  );
}
