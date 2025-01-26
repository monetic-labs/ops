"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Backpack, Fingerprint } from "lucide-react";
import { Spinner } from "@nextui-org/spinner";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";
import { entryPoint07Address } from "viem/account-abstraction";
import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { LocalStorage } from "@/utils/localstorage";
import pylon from "@/libs/pylon-sdk";

interface UserInviteDetails {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function InvitePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserInviteDetails>({
    company: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  useEffect(() => {
    const verifyInvite = async () => {
      if (!token) return;

      try {
        // @ts-ignore - Method will be added to SDK
        const response = await pylon.verifyInvite(token);
        setUserDetails({
          company: response.company,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          phoneNumber: "",
        });
      } catch (error) {
        console.error("Verification error:", error);
        setError("Invalid or expired invite link");
        router.push("/auth");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyInvite();
  }, [token, router]);

  const handlePasskeyRegistration = async () => {
    setIsLoading(true);
    try {
      const webauthnHelper = new WebAuthnHelper(window.location.hostname);

      // Create passkey
      const { publicKeyCoordinates, passkeyId } = await webauthnHelper.createPasskey();

      // Initialize Safe account with WebAuthn public key
      const safeAccount = SafeAccount.initializeNewAccount([publicKeyCoordinates], {
        eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
        entrypointAddress: entryPoint07Address,
      });

      const walletAddress = safeAccount.accountAddress as Address;

      // TODO: Call pylon.redeemInvite with token and passkey data
      // @ts-ignore - Method will be added to SDK
      await pylon.redeemInvite({
        token: token!,
        phoneNumber: userDetails.phoneNumber,
        walletAddress,
        passkeyId,
      });

      // Store user data and redirect to dashboard
      LocalStorage.setSafeUser(publicKeyCoordinates, walletAddress, walletAddress, passkeyId, true);
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to register passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.phoneNumber) {
      setError("Please enter your phone number");
      return;
    }
    handlePasskeyRegistration();
  };

  if (isVerifying) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <div className="w-full sm:max-w-md">
      <Card className="bg-transparent sm:bg-zinc-800/90 backdrop-blur-xl border-none shadow-none sm:shadow-2xl">
        <CardHeader className="flex flex-col gap-2 p-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5">
              <Backpack className="w-5 h-5 text-white/70" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Complete Registration</h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base">Set up your account with a passkey</p>
        </CardHeader>
        <CardBody className="px-6 pb-6 sm:px-8 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company"
              value={userDetails.company}
              isDisabled
              classNames={{
                input: "text-white/60",
              }}
            />
            <Input
              label="First Name"
              value={userDetails.firstName}
              isDisabled
              classNames={{
                input: "text-white/60",
              }}
            />
            <Input
              label="Last Name"
              value={userDetails.lastName}
              isDisabled
              classNames={{
                input: "text-white/60",
              }}
            />
            <Input
              label="Email"
              value={userDetails.email}
              isDisabled
              classNames={{
                input: "text-white/60",
              }}
            />
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={userDetails.phoneNumber}
              onChange={(e) => setUserDetails({ ...userDetails, phoneNumber: e.target.value })}
              required
            />
            <Button
              className="w-full bg-white/10 hover:bg-white/20 text-white h-14"
              isLoading={isLoading}
              radius="lg"
              type="submit"
              startContent={!isLoading && <Fingerprint className="w-5 h-5" />}
            >
              Register with Passkey
            </Button>
          </form>
          {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        </CardBody>
      </Card>
    </div>
  );
}
