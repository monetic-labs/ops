"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Backpack, Fingerprint, KeyRound, ShieldCheck, Sun, Moon, Signature, ShieldPlus, Cable } from "lucide-react";
import { useRouter } from "next/navigation";
import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useAccounts } from "@/contexts/AccountContext";
import { OnboardingState } from "@/utils/localstorage";
import { createSafeAccount } from "@/utils/safe";
import { useTheme } from "@/hooks/useTheme";

export default function AuthPage() {
  const { toggleTheme, isDark } = useTheme();
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
    <div className="min-h-screen w-full grid lg:grid-cols-2">
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

      {/* Left Side - Marketing/Feature Showcase */}
      <div className="hidden lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-charyo-950 via-charyo-900 to-notpurple-900" />
        <div className="absolute inset-0">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative w-full flex items-center p-12">
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-5xl font-semibold text-foreground space-y-2">
                <span className="block">Business Banking</span>
                <span className="block text-primary">on your terms</span>
              </h2>
              <p className="text-lg text-foreground/60">
                Your business deserves better than traditional banking. Full control over your accounts, team access
                management, and seamless transfers—all backed by battle-tested smart contracts.
              </p>
            </div>

            {/* Merged Stats & Benefits Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 flex items-start gap-3 p-4 rounded-xl bg-content1/40 backdrop-blur-lg border border-primary/10 group relative">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-primary">Enterprise Grade</div>
                  <div className="text-sm text-foreground/60">
                    Battle-tested security with $100B+ protected powered by Safe
                    <div className="absolute invisible group-hover:visible bg-content1 text-foreground p-3 rounded-lg shadow-xl border border-primary/10 w-72 -translate-y-full -translate-x-1/2 left-1/2 top-0 mt-2">
                      <p className="text-xs leading-relaxed">
                        All funds are FDIC insured. We're also working on additional on-chain insurance through Nexus
                        Mutual, providing coverage beyond traditional limits while maintaining self-custody of your
                        assets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-content1/40 backdrop-blur-lg border border-primary/10">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Signature className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-primary">Full Control</div>
                  <div className="text-sm text-foreground/60">Manage team access and set custom policies</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-content1/40 backdrop-blur-lg border border-primary/10">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Cable className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-primary">Sponsored</div>
                  <div className="text-sm text-foreground/60">No gas fees for transactions</div>
                </div>
              </div>
            </div>

            {/* Animated Cards */}
            <div className="relative h-[200px] w-full">
              {[
                {
                  amount: "130,347.50",
                  label: "Operating Account",
                  details: [
                    { secondary: "Primary", detail: "Team access & payments" },
                    { secondary: "ACH/Wire", detail: "Send money anywhere" },
                    { secondary: "Cards", detail: "Virtual card creation" },
                  ],
                },
                {
                  amount: "8,942.51",
                  label: "Treasury",
                  details: [
                    { secondary: "High-Yield", detail: "Secure capital allocation" },
                    { secondary: "4.25% APY", detail: "Competitive returns" },
                    { secondary: "Flexible", detail: "Instant access to funds" },
                  ],
                },
                {
                  amount: "5,721.90",
                  label: "Card Issuing",
                  details: [
                    { secondary: "Active", detail: "Team expenses & vendors" },
                    { secondary: "Virtual", detail: "Instant card creation" },
                    { secondary: "Card Controls", detail: "Set spending limits" },
                  ],
                },
              ].map((card, index) => (
                <div
                  key={index}
                  className="absolute inset-0 transition-all duration-500 ease-in-out hover:-translate-y-2"
                  style={{
                    transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
                    zIndex: 3 - index,
                  }}
                >
                  <div
                    className={`${index === 0 ? "bg-content1" : "bg-content1/80"} backdrop-blur-xl border border-primary/10 rounded-2xl p-6 space-y-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Backpack className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xl font-medium text-foreground">$ {card.amount} USD</span>
                    </div>
                    <div className="space-y-2 h-[40px] relative overflow-hidden">
                      <div className="absolute inset-0">
                        <div className="animate-cardInfo">
                          {card.details.map((detail, i) => (
                            <div key={i} className="h-[40px]">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-foreground/60">{card.label}</span>
                                <span className="text-sm font-medium">{detail.secondary}</span>
                              </div>
                              <div className="text-xs text-foreground/40">{detail.detail}</div>
                            </div>
                          ))}
                          {/* Repeat first item to make the loop seamless */}
                          <div className="h-[40px]">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-foreground/60">{card.label}</span>
                              <span className="text-sm font-medium">{card.details[0].secondary}</span>
                            </div>
                            <div className="text-xs text-foreground/40">{card.details[0].detail}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add keyframes for the card info animation */}
            <style jsx global>{`
              @keyframes cardInfo {
                0% {
                  transform: translateY(0);
                }
                25%,
                33% {
                  transform: translateY(-40px);
                }
                58%,
                66% {
                  transform: translateY(-80px);
                }
                91%,
                100% {
                  transform: translateY(-120px);
                }
              }

              .animate-cardInfo {
                animation: cardInfo 12s infinite;
                animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-background/50 to-background/80" />
        <div className="relative w-full max-w-md">
          <Card className="bg-content1 border-none shadow-xl">
            <CardBody className="gap-8 p-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-primary/5">
                  <Backpack className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Welcome Back</h1>
                  <p className="text-foreground/60 text-base mt-1">Access your business accounts securely</p>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 text-base"
                  isLoading={isLoading}
                  startContent={!isLoading && <Fingerprint className="w-5 h-5" />}
                  onClick={() => handlePasskeyAuth(true)}
                >
                  Continue with Passkey
                </Button>
                <button
                  className="w-full text-center text-sm text-foreground/60 hover:text-foreground transition-colors p-2"
                  onClick={() => router.push("/auth/recovery")}
                >
                  Forgot your passkey?
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <Divider className="flex-1 bg-divider" />
                <span className="text-foreground/60 text-sm font-medium">New to Backpack?</span>
                <Divider className="flex-1 bg-divider" />
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon: <Fingerprint className="w-5 h-5 text-primary" />,
                      title: "No Passwords Needed",
                      description: "Log in with your face or fingerprint",
                    },
                    {
                      icon: <KeyRound className="w-5 h-5 text-primary" />,
                      title: "Works Everywhere",
                      description: "Seamless login across all your devices",
                    },
                    {
                      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                      title: "Enhanced Security",
                      description: "Stay protected from phishing and hacking attempts",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-content2 hover:bg-content3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">{feature.icon}</div>
                      <div>
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-foreground/60">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Account Button */}
                <Button
                  className="w-full bg-content2 hover:bg-content3 text-primary h-12 text-base font-medium"
                  isDisabled={isDisabled}
                  isLoading={isLoading}
                  startContent={!isLoading && <KeyRound className="w-5 h-5" />}
                  onClick={() => handlePasskeyAuth(false)}
                >
                  {notification ? "Passkey Already Exists" : "Create Business Account"}
                </Button>
                {notification && <div className="text-danger text-center text-sm">{notification}</div>}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
