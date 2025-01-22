"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Backpack, Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { WebAuthnHelper } from "@/utils/webauthn";
import { SafeAccountHelper } from "@/utils/safeAccount";

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
  const router = useRouter();

  const handlePasskeyAuth = async (isLogin: boolean) => {
    setIsLoading(true);
    try {
      const webauthnHelper = new WebAuthnHelper();

      if (isLogin) {
        // TODO: Login with passkey
        const { signer, signature } = await webauthnHelper.signMessage("0xdeadbeef");

        // router.refresh();
      } else {
        // Create new passkey
        const { publicKeyCoordinates } = await webauthnHelper.createPasskey();
        const safeHelper = new SafeAccountHelper(publicKeyCoordinates);
        // router.push("/onboard");
      }
    } catch (error) {
      console.error("Passkey error:", error);

      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full sm:max-w-md">
      <Card className="bg-transparent sm:bg-zinc-800/90 backdrop-blur-xl border-none shadow-none sm:shadow-2xl">
        <CardHeader className="flex flex-col gap-2 p-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5">
              <Backpack className="w-5 h-5 text-white/70" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Self Banking Portal</h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base">Welcome to the future of banking</p>
        </CardHeader>
        <CardBody className="px-6 pb-6 sm:px-8 flex flex-col items-center gap-6">
          {/* Sign In Section */}
          <Button
            className="w-full bg-white/10 hover:bg-white/20 text-white h-14"
            radius="lg"
            isLoading={isLoading}
            onClick={() => handlePasskeyAuth(true)}
            startContent={!isLoading && <Fingerprint className="w-5 h-5" />}
          >
            Continue with Passkey
          </Button>

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
              radius="lg"
              isLoading={isLoading}
              onClick={() => handlePasskeyAuth(false)}
              startContent={!isLoading && <KeyRound className="w-5 h-5" />}
            >
              Create Passkey
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
