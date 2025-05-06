"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/spinner";

import pylon from "@/libs/monetic-sdk";
import { useUser } from "@/contexts/UserContext";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"initial" | "exchanging" | "completing" | "error">("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { forceAuthCheck } = useUser();
  const hasAttemptedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams?.get("token");

      // Prevent multiple verification attempts of the same token
      if (hasAttemptedRef.current) {
        return;
      }
      hasAttemptedRef.current = true;

      if (!token) {
        setStatus("error");
        setErrorMessage("No verification token found. Please try logging in again.");
        redirectTimeoutRef.current = setTimeout(() => {
          router.replace("/auth");
        }, 3000);
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
        const isAuthenticated = await forceAuthCheck();

        if (!isAuthenticated) {
          throw new Error("Failed to establish session");
        }

        // Step 3: Redirect to home
        router.replace("/");
      } catch (error: any) {
        console.error("Token verification failed:", error);
        setStatus("error");

        if (error.code === 400 && error.message === "Invalid or expired token") {
          setErrorMessage("Invalid or expired token. Please try logging in again.");
        } else {
          setErrorMessage("Failed to verify your login link. Please try again.");
        }

        // Redirect after error delay
        redirectTimeoutRef.current = setTimeout(() => {
          router.replace("/auth");
        }, 3000);
      }
    };

    verifyToken();

    return () => {
      // Clean up any pending redirects
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
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
