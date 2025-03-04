"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Link } from "@nextui-org/link";
import { Backpack, Mail, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/hooks/useTheme";

interface PasskeyOptions {
  challenge: string;
  allowCredentials: Array<{
    id: string;
    transports: string[];
    type: string;
  }>;
  timeout: number;
  userVerification: string;
  rpId: string;
}

interface PasskeyCredential {
  credentialId: string;
  displayName: string | null;
}

const AuthPage = () => {
  const { toggleTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [passkeyCredentials, setPasskeyCredentials] = useState<PasskeyCredential[]>([]);
  const router = useRouter();
  const { isAuthenticated, setCredentials } = useUser();
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handlePasskeyAuth = async (credentials: PasskeyCredential[]) => {
    setIsLoading(true);
    try {
      const webauthnHelper = new WebAuthnHelper();
      const { publicKey, credentialId } = await webauthnHelper.loginWithPasskey();

      // Set credentials in context
      setCredentials({ publicKey, credentialId });

      router.push("/");
    } catch (error) {
      console.error("Passkey error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

      // For any passkey error, automatically fall back to email
      setNotification("Sending you a login link via email...");
      // Short delay to show the message before sending email
      setTimeout(async () => {
        await handleEmailAuth();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthOptions = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8001/v1/auth/passkey?email=${encodeURIComponent(email)}`);
      const { data } = await response.json();

      if (data && data.length > 0) {
        // User has passkeys, immediately try passkey login
        setPasskeyCredentials(data);
        await handlePasskeyAuth(data);
      } else {
        // No passkeys, send email
        await handleEmailAuth();
      }
    } catch (error) {
      console.error("Error checking auth options:", error);
      setNotification("Failed to check authentication options");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);

      // Send magic link email
      const response = await fetch("http://localhost:8001/v1/auth/magic_link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const { data } = await response.json();

      setEmailSent(true);
      setNotification(data.message);
    } catch (error) {
      console.error("Email auth error:", error);
      setNotification("Failed to send login email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative p-4">
      {/* Theme Toggle */}
      <Button
        isIconOnly
        className="fixed top-4 right-4 z-50 bg-content1/10 backdrop-blur-lg border border-primary/10"
        radius="lg"
        variant="flat"
        onPress={toggleTheme}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-background/50 to-background/80" />

      {/* Auth Card */}
      <div className="relative w-full max-w-md">
        <Card className="bg-content1/40 backdrop-blur-xl border border-primary/10 shadow-xl">
          <CardBody className="gap-8 p-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-primary/5">
                <Backpack className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {emailSent ? "Check Your Email" : "Welcome to Backpack"}
                </h1>
                <p className="text-foreground/60 text-base mt-1">
                  {emailSent ? "We've sent you a login link" : "Enter your email to register or login"}
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startContent={<Mail className="w-4 h-4 text-default-400" />}
                isDisabled={isLoading || emailSent}
              />

              {!emailSent && (
                <>
                  <p className="text-sm text-foreground/60 text-center">
                    By continuing, you agree to our{" "}
                    <Link href="https://backpack.network/terms-of-service" className="text-sm text-primary">
                      Terms of Service
                    </Link>
                  </p>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 text-base"
                    isLoading={isLoading}
                    onClick={() => checkAuthOptions(email)}
                    isDisabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || isLoading}
                  >
                    Continue
                  </Button>
                </>
              )}
            </div>

            {notification && (
              <div className="text-center">
                <p
                  className={`text-sm ${notification.includes("registered") || notification.includes("Sending") ? "text-success" : "text-danger"}`}
                >
                  {notification}
                </p>
              </div>
            )}

            {emailSent && (
              <>
                <Button
                  className="w-full border-default-200 bg-default-100 dark:bg-default-50 hover:!bg-default-200 h-12 text-base"
                  variant="bordered"
                  onClick={() => {
                    setEmailSent(false);
                    setNotification(null);
                    setEmail("");
                  }}
                >
                  Try Different Email
                </Button>

                {passkeyCredentials.length > 0 && (
                  <div className="text-center mt-4">
                    <Link
                      className="text-sm text-primary hover:underline"
                      href={`/auth/recover?email=${encodeURIComponent(email)}`}
                    >
                      Forgot your passkey?
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
