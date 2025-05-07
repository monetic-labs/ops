"use client";

import type { Passkey as PasskeyCredential } from "@monetic-labs/sdk";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Backpack, Mail, Sun, Moon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/hooks/generics/useTheme";
import pylon from "@/libs/monetic-sdk";
import { LocalStorage } from "@/utils/localstorage";

const AuthPage = () => {
  const { toggleTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [buttonStatusText, setButtonStatusText] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [passkeyCredentials, setPasskeysCredentials] = useState<PasskeyCredential[]>([]);
  const router = useRouter();
  const { isAuthenticated, addCredential, forceAuthCheck } = useUser();
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const checkAuthOptions = async (email: string) => {
    try {
      setIsLoading(true);
      const passkeys = await pylon.getPasskeys(email);

      if (passkeys && passkeys.length > 0) {
        // User has passkeys, immediately try passkey login
        setPasskeysCredentials(passkeys);
        setButtonStatusText("Authenticating...");
        await handlePasskeyAuth(passkeys);
      } else {
        // No passkeys, send email
        await handleEmailAuth();
      }
    } catch (error) {
      console.error("Error checking auth options:", error);
      setNotification("Failed to check authentication options");
      setButtonStatusText(null);
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async (credentials: PasskeyCredential[]) => {
    setIsLoading(true);
    try {
      // Authenticate with WebAuthn
      const webauthn = await WebAuthnHelper.login(credentials);

      // Get credentials from the instance
      const { publicKey, credentialId } = webauthn.getCredentials();

      // Add the authenticated credential to our context
      addCredential({ publicKey, credentialId });
      setButtonStatusText("Redirecting...");

      // Store the credential ID in localStorage for persistence
      try {
        LocalStorage.saveSelectedCredentialId(credentialId);
      } catch (error) {
        console.error("Error storing credential:", error);
        // Continue even if storage fails
      }

      // Force an auth check to ensure session is created
      await forceAuthCheck();

      // Add a delay to ensure auth state is fully established
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Only redirect after auth state has had time to update
      router.push("/");
    } catch (error) {
      console.error("Passkey error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

      // For any passkey error, automatically fall back to email
      setButtonStatusText("Sending link...");
      // Short delay to show the message before sending email
      setTimeout(async () => {
        await handleEmailAuth();
      }, 1500);
    } finally {
      setIsLoading(false);
      setButtonStatusText(null);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);
      await pylon.issueMagicLink(email);
      setEmailSent(true);
      setResendCooldown(60); // Start 60 second cooldown
      setNotification(null);
      setButtonStatusText(null);
    } catch (error) {
      console.error("Email auth error:", error);
      setNotification("Failed to send login email");
      setButtonStatusText(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setEmailSent(false);
    setNotification(null);
    setButtonStatusText(null);
    setEmail("");
    setResendCooldown(0);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="absolute top-4 right-4">
        <Button
          isIconOnly
          className="bg-content2/50 backdrop-blur-lg"
          radius="full"
          variant="flat"
          onPress={toggleTheme}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-content1/95 backdrop-blur-xl border border-border shadow-2xl">
          <CardBody className="py-8 px-6">
            {emailSent && (
              <div className="absolute top-8 left-6">
                <Button
                  className="bg-transparent hover:bg-content2 min-w-unit-16 h-unit-8 px-3"
                  radius="full"
                  size="sm"
                  startContent={<ArrowLeft className="w-4 h-4" />}
                  variant="light"
                  onPress={handleBack}
                >
                  Back
                </Button>
              </div>
            )}
            <div className="flex flex-col items-center gap-6 mb-6">
              <Backpack className="w-10 h-10 text-primary" />
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  {emailSent ? "Check Your Email" : "Sign in or Register"}
                </h1>
                <p className="text-foreground/60">
                  {emailSent ? "We'll send you a magic link if an account exists" : "Enter your email to continue"}
                </p>
                {emailSent && <p className="text-sm text-foreground/60 mt-1">{email}</p>}
              </div>
            </div>

            {!emailSent ? (
              <div className="space-y-4">
                <Input
                  isDisabled={isLoading}
                  label="Email Address"
                  placeholder="Enter your email"
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !isLoading) {
                      checkAuthOptions(email);
                    }
                  }}
                />

                <p className="text-sm text-foreground/60 text-center">
                  By continuing, you agree to our{" "}
                  <Link className="text-sm text-primary" href="https://monetic.xyz/terms-of-service">
                    Terms of Service
                  </Link>
                </p>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 text-base"
                  isDisabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || isLoading}
                  isLoading={isLoading}
                  onPress={() => checkAuthOptions(email)}
                >
                  {isLoading ? buttonStatusText || "Working..." : "Continue"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 text-base"
                  isDisabled={resendCooldown > 0 || isLoading}
                  isLoading={isLoading}
                  onPress={() => handleEmailAuth()}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : isLoading
                      ? buttonStatusText || "Sending..."
                      : "Resend Email"}
                </Button>

                {/* TODO: Add email recovery link & page */}
                {/* {passkeyCredentials.length > 0 && (
                  <div className="text-center mt-4">
                    <Link
                      className="text-sm text-primary hover:underline"
                      href={`/auth/recover?email=${encodeURIComponent(email)}`}
                    >
                      Lost your passkey?
                    </Link>
                  </div>
                )} */}
              </div>
            )}

            {notification && (
              <div className="text-center mt-4">
                <p className="text-sm text-danger">{notification}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
