"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/spinner";

import pylon from "@/libs/pylon-sdk";
import { useUser } from "@/contexts/UserContext";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"initial" | "exchanging" | "completing" | "error">("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { forceAuthCheck } = useUser();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams?.get("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      try {
        // Step 1: Exchange token
        setStatus("exchanging");
        const isTokenExchanged = await pylon.exchangeMagicLinkToken(token);

        if (!isTokenExchanged) {
          throw new Error("Token exchange failed");
        }

        // Step 2: Establish session
        setStatus("completing");
        await forceAuthCheck();

        // Step 3: Redirect to home
        router.replace("/");
      } catch (error) {
        console.error("Token verification failed:", error);
        setStatus("error");
        setErrorMessage("Failed to verify your login link. Please try again.");

        // Redirect after error delay
        setTimeout(() => {
          router.replace("/auth");
        }, 3000);
      }
    };

    verifyToken();
  }, [searchParams, router, forceAuthCheck]);

  // Status messages
  const getStatusMessage = () => {
    switch (status) {
      case "exchanging":
        return "Verifying your login...";
      case "completing":
        return "Completing your sign in...";
      case "error":
        return errorMessage || "An error occurred";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      {status === "error" ? (
        <div className="text-danger text-center">
          <p>{errorMessage}</p>
          <p className="text-sm text-foreground/60 mt-2">Redirecting you back to login...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-foreground/60">{getStatusMessage()}</p>
        </div>
      )}
    </div>
  );
}
