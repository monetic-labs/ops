"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Backpack, Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useAccounts } from "@/contexts/AccountContext";
import { OnboardingState } from "@/utils/localstorage";
import { createSafeAccount } from "@/utils/safe";

const SecurityFeatures = () => (
  <div className="space-y-4 text-default-500">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white/5">
        <Fingerprint className="w-5 h-5 text-ualert-500/70" />
      </div>
      <div className="space-y-0.5">
        <h3 className="font-medium text-white text-base">No Password Needed</h3>
        <p className="text-sm text-white/60">Log in securely with your face or fingerprint.</p>
      </div>
    </div>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white/5">
        <KeyRound className="w-5 h-5 text-ualert-500/70" />
      </div>
      <div className="space-y-0.5">
        <h3 className="font-medium text-white text-base">Works Everywhere</h3>
        <p className="text-sm text-white/60">Seamless login across all your devices.</p>
      </div>
    </div>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white/5">
        <ShieldCheck className="w-5 h-5 text-ualert-500/70" />
      </div>
      <div className="space-y-0.5">
        <h3 className="font-medium text-white text-base">Enhanced Security</h3>
        <p className="text-sm text-white/60">Stay protected from phishing and hacking attempts.</p>
      </div>
    </div>
  </div>
);

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, setAuth, setOnboarding } = useAccounts();

  useEffect(() => {
    if (isAuthenticated) {
      setIsDisabled(true);
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handlePasskeyAuth = async (isLogin: boolean) => {
    setIsLoading(true);
    try {
      const webauthnHelper = new WebAuthnHelper();

      if (isLogin) {
        // Login with passkey
        const { publicKey, credentialId } = await webauthnHelper.loginWithPasskey();

        // Create safe accounts with WebAuthn signer
        const walletAddress = createSafeAccount({
          signer: publicKey,
          isWebAuthn: true,
        });

        // Create settlement account with wallet as signer
        const settlementAddress = createSafeAccount({
          signer: walletAddress,
        });

        // Store login state using context
        setAuth({
          credentials: { publicKey, credentialId },
          isLoggedIn: true,
        });

        router.push("/");
      } else {
        if (isAuthenticated) {
          setNotification("You already have a passkey. Please use it to sign in.");
          return;
        }

        // Create new passkey
        const { publicKeyCoordinates: publicKey, credentialId } = await webauthnHelper.createPasskey();

        // Create safe accounts
        const walletAddress = createSafeAccount({
          signer: publicKey,
          isWebAuthn: true,
        });

        const settlementAddress = createSafeAccount({
          signer: walletAddress,
        });

        // Store onboarding state
        const onboardingState: OnboardingState = {
          credentials: {
            publicKey,
            credentialId,
          },
          walletAddress: walletAddress as Address,
          settlementAddress: settlementAddress as Address,
        };

        setOnboarding(onboardingState);
        router.push("/onboard");
      }
    } catch (error) {
      console.error("Passkey error:", error);
      if (error instanceof Error) {
        setNotification(error.message);
      } else {
        setNotification("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full sm:max-w-md">
      <Card className="bg-transparent sm:bg-zinc-800/90 backdrop-blur-xl sm:border border-zinc-700 rounded-xl shadow-none">
        <CardHeader className="flex flex-col gap-2 p-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5">
              <Backpack className="w-5 h-5 text-white/70" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Self Banking Portal</h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base">Welcome to the future of banking, skeptic</p>
        </CardHeader>
        <CardBody className="px-6 pb-6 sm:px-8 flex flex-col items-center gap-6">
          {/* Sign In Section */}
          <div className="w-full space-y-2">
            <Button
              className="w-full bg-white/10 hover:bg-white/20 text-white h-14"
              isLoading={isLoading}
              radius="lg"
              startContent={!isLoading && <Fingerprint className="w-5 h-5" />}
              onClick={() => handlePasskeyAuth(true)}
            >
              Continue with Passkey
            </Button>

            {/* Lost Passkey Link */}
            <div className="flex justify-center">
              <button
                className="text-white/60 hover:text-white text-sm transition-colors"
                onClick={() => router.push("/auth/recovery")}
              >
                Forgot your passkey?
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4">
            <Divider className="flex-1 bg-white/20" />
            <span className="text-white/60 text-sm">or sign up</span>
            <Divider className="flex-1 bg-white/20" />
          </div>

          {/* Sign Up Section */}
          <div className="w-full space-y-6">
            <div className="p-4 rounded-xl bg-white/5">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Secure Your Wallet with a Passkey</h3>
              <SecurityFeatures />
            </div>
            <Button
              className="w-full bg-white/10 hover:bg-white/20 text-white h-14"
              isDisabled={isDisabled}
              isLoading={isLoading}
              radius="lg"
              startContent={!isLoading && <KeyRound className="w-5 h-5" />}
              onClick={() => handlePasskeyAuth(false)}
            >
              {notification ? "Passkey Already Exists" : "Create Passkey"}
            </Button>
            {notification ? <div className="text-red-200 text-center"> {notification} </div> : undefined}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
