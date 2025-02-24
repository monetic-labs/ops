"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Backpack, Fingerprint, Sun, Moon } from "lucide-react";
import { Spinner } from "@nextui-org/spinner";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";
import { entryPoint07Address } from "viem/account-abstraction";
import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { LocalStorage } from "@/utils/localstorage";
import { useUser } from "@/contexts/UserContext";
import pylon from "@/libs/pylon-sdk";
import { formatPhoneNumber } from "@/utils/helpers";
import { useTheme } from "@/hooks/useTheme";

interface UserInviteDetails {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export default function InvitePage() {
  const { toggleTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserInviteDetails>({
    company: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: null,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useUser();
  const token = searchParams?.get("token");

  useEffect(() => {
    const verifyInvite = async () => {
      if (!token) {
        setError("Invalid invite link - no token provided");

        return;
      }

      try {
        const response = await pylon.getInvite(token);

        setUserDetails({
          company: response.merchant,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          phoneNumber: null,
        });
      } catch (error) {
        console.error("Verification error:", error);
        setError("Invalid or expired invite link");
        setTimeout(() => {
          router.push("/auth");
        }, 3000); // Delay to allow error message to be displayed
      } finally {
        setIsVerifying(false);
      }
    };

    verifyInvite();
  }, [token]);

  const handlePasskeyRegistration = async () => {
    if (!userDetails.phoneNumber) {
      setError("Please enter your phone number");

      return;
    }

    setIsLoading(true);
    try {
      const webauthnHelper = new WebAuthnHelper();

      // Create passkey
      const { publicKeyCoordinates, passkeyId, credentialId } = await webauthnHelper.createPasskey();

      // Initialize Safe account with WebAuthn public key
      const safeAccount = SafeAccount.initializeNewAccount([publicKeyCoordinates], {
        eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
        entrypointAddress: entryPoint07Address,
      });

      const walletAddress = safeAccount.accountAddress as Address;

      await pylon.redeemInvite(token!, {
        phoneNumber: userDetails.phoneNumber,
        walletAddress,
        passkeyId,
      });

      // Store auth state just like regular login
      const credentials = { publicKey: publicKeyCoordinates, credentialId };

      LocalStorage.setAuth(credentials, true);
      setAuth({ credentials, isLoggedIn: true });

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
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      {/* Theme Toggle */}
      <Button
        isIconOnly
        className="fixed top-4 right-4 z-50 bg-content1/10 backdrop-blur-lg border border-border"
        radius="lg"
        variant="flat"
        onPress={toggleTheme}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <div className="w-full sm:max-w-md px-4">
        <Card className="bg-transparent dark:sm:bg-content1 sm:bg-white border-none shadow-none sm:shadow-2xl">
          <CardHeader className="flex flex-col gap-2 p-6 sm:px-8 sm:pt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Backpack className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Complete Registration</h1>
            </div>
            <p className="text-foreground/60 text-sm sm:text-base">Set up your account with a passkey</p>
          </CardHeader>
          <CardBody className="px-6 pb-6 sm:px-8 flex flex-col gap-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                isDisabled
                classNames={{
                  base: "max-w-full",
                  label: "text-foreground/90",
                  input: "text-foreground/60",
                  inputWrapper: "bg-content2 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content2",
                }}
                label="Company"
                value={userDetails.company}
              />
              <Input
                isDisabled
                classNames={{
                  base: "max-w-full",
                  label: "text-foreground/90",
                  input: "text-foreground/60",
                  inputWrapper: "bg-content2 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content2",
                }}
                label="First Name"
                value={userDetails.firstName}
              />
              <Input
                isDisabled
                classNames={{
                  base: "max-w-full",
                  label: "text-foreground/90",
                  input: "text-foreground/60",
                  inputWrapper: "bg-content2 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content2",
                }}
                label="Last Name"
                value={userDetails.lastName}
              />
              <Input
                isDisabled
                classNames={{
                  base: "max-w-full",
                  label: "text-foreground/90",
                  input: "text-foreground/60",
                  inputWrapper: "bg-content2 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content2",
                }}
                label="Email"
                value={userDetails.email}
              />
              <Input
                required
                classNames={{
                  base: "max-w-full",
                  label: "text-foreground/90",
                  input: "text-foreground",
                  inputWrapper: "bg-content2 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content2",
                }}
                label="Phone Number"
                placeholder="Enter your phone number"
                startContent={<div className="text-foreground/60 text-sm">+1</div>}
                value={userDetails.phoneNumber ? formatPhoneNumber(userDetails.phoneNumber) : ""}
                onChange={(e) => {
                  const rawNumber = e.target.value.replace(/\D/g, "");

                  setUserDetails({ ...userDetails, phoneNumber: rawNumber });
                }}
              />
              <Button
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary h-14"
                isLoading={isLoading}
                radius="lg"
                startContent={!isLoading && <Fingerprint className="w-5 h-5" />}
                type="submit"
              >
                Register with Passkey
              </Button>
            </form>
            {error && <div className="text-danger text-center text-sm">{error}</div>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
