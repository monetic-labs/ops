"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import {
  Backpack,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Sun,
  Moon,
  Signature,
  ShieldPlus,
  Cable,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useUser } from "@/contexts/UserContext";
import { OnboardingState } from "@/utils/localstorage";
import { createSafeAccount } from "@/utils/safe";
import { useTheme } from "@/hooks/useTheme";

const AuthPage = () => {
  const { toggleTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, setAuth, setOnboarding } = useUser();

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
        const { address: walletAddress } = createSafeAccount({
          signers: [publicKey],
          isWebAuthn: true,
        });

        // Create settlement account with wallet as signer
        const { address: settlementAddress } = createSafeAccount({
          signers: [walletAddress],
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
        const { address: walletAddress } = createSafeAccount({
          signers: [publicKey],
          isWebAuthn: true,
        });

        const { address: settlementAddress } = createSafeAccount({
          signers: [walletAddress],
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

  const cards = [
    {
      amount: "130,347.50",
      label: "Operating Account",
      details: [
        { secondary: "Primary", detail: "Team access & payments" },
        { secondary: "ACH & Wire", detail: "Send money anywhere" },
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
  ];

  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const handleCardChange = (index: number) => {
    setSelectedCardIndex(index);
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
                    Safe accounts securing $100B+ in value
                    <div className="absolute invisible group-hover:visible bg-content1 text-foreground p-3 rounded-lg shadow-xl border border-primary/10 w-72 -translate-y-full -translate-x-1/2 left-1/2 top-0 mt-2">
                      <p className="text-xs leading-relaxed">
                        All funds are FDIC insured. We&apos;re also working on additional on-chain insurance through
                        Nexus Mutual, providing coverage beyond traditional limits while maintaining self-custody of
                        your assets.
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
            <div className="relative h-[200px] w-full group">
              {/* Cards Stack */}
              <div className="relative h-full">
                {cards.map((card, index) => {
                  const isActive = index === selectedCardIndex;
                  const isPrevious =
                    (selectedCardIndex === 0 && index === cards.length - 1) || index === selectedCardIndex - 1;
                  const isNext =
                    (selectedCardIndex === cards.length - 1 && index === 0) || index === selectedCardIndex + 1;

                  return (
                    <button
                      key={index}
                      aria-label={`Select ${card.label} card`}
                      className={`absolute inset-0 w-full text-left transition-all duration-300 ${
                        isActive
                          ? "z-20 opacity-100 translate-y-0"
                          : isPrevious
                            ? "z-10 opacity-40 -translate-y-2 scale-[0.97] hover:opacity-60"
                            : isNext
                              ? "z-10 opacity-40 translate-y-2 scale-[0.97] hover:opacity-60"
                              : "opacity-0 translate-y-4 scale-95"
                      }`}
                      onClick={() => handleCardChange(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCardChange(index);
                        }
                      }}
                    >
                      <div
                        className={`h-full bg-default-100 dark:bg-content1 rounded-xl p-4 ${
                          isActive ? "animate-fade-in" : ""
                        }`}
                      >
                        {/* Card Content */}
                        <div className="flex flex-col h-full">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Backpack className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-default-600 dark:text-foreground/60">{card.label}</span>
                              <span className="text-xl font-medium text-default-900 dark:text-foreground">
                                $ {card.amount} USD
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 flex-grow">
                            {card.details.map((detail, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-default-900 dark:text-foreground">
                                  {detail.secondary}
                                </span>
                                <span className="text-xs text-default-600 dark:text-foreground/60">
                                  {detail.detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-30">
                <button
                  aria-label="Previous card"
                  className="pointer-events-auto -ml-4 p-2 rounded-full bg-default-100/80 dark:bg-content1/80 backdrop-blur-sm border border-default-200 dark:border-foreground/10 hover:bg-default-100 dark:hover:bg-content1 transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = selectedCardIndex === 0 ? cards.length - 1 : selectedCardIndex - 1;

                    handleCardChange(newIndex);
                  }}
                >
                  <ChevronLeft className="w-4 h-4 text-default-600 dark:text-foreground/60" />
                </button>
                <button
                  aria-label="Next card"
                  className="pointer-events-auto -mr-4 p-2 rounded-full bg-default-100/80 dark:bg-content1/80 backdrop-blur-sm border border-default-200 dark:border-foreground/10 hover:bg-default-100 dark:hover:bg-content1 transition-all opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = selectedCardIndex === cards.length - 1 ? 0 : selectedCardIndex + 1;

                    handleCardChange(newIndex);
                  }}
                >
                  <ChevronRight className="w-4 h-4 text-default-600 dark:text-foreground/60" />
                </button>
              </div>

              {/* Navigation Dots */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex space-x-1">
                {cards.map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`Go to card ${idx + 1}`}
                    className={`w-1 h-1 rounded-full transition-all ${
                      idx === selectedCardIndex
                        ? "w-3 bg-primary"
                        : "bg-default-200 hover:bg-default-300 dark:bg-foreground/20 dark:hover:bg-foreground/30"
                    }`}
                    onClick={() => handleCardChange(idx)}
                  />
                ))}
              </div>
            </div>
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
};

export default AuthPage;
