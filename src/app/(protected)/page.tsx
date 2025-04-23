"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { SkeletonAccountCard } from "./account/_components/SkeletonLoaders";

export default function DashboardPage() {
  const router = useRouter();
  const { accounts, isLoadingAccounts } = useAccounts();
  const { isLoading: isUserLoading } = useUser();

  useEffect(() => {
    // Wait for accounts to load
    if (isLoadingAccounts || isUserLoading) return;

    // If we have accounts, redirect to the first one
    if (accounts.length > 0) {
      const firstAccount = accounts.find((acc) => !acc.isDisabled && !acc.isComingSoon);
      if (firstAccount) {
        router.replace(`/account/${firstAccount.id}`);
        return;
      }
    }

    // If no accounts are available, we could show a different state or message
    // This will be handled by the loading/no accounts UI below
  }, [accounts, isLoadingAccounts, isUserLoading, router]);

  // Show loading state while accounts are being fetched
  if (isLoadingAccounts || isUserLoading) {
    return <SkeletonAccountCard />;
  }

  // Calculate if there are any redirectable accounts AFTER loading is complete
  const hasEnabledAccounts = accounts.some((acc) => !acc.isDisabled && !acc.isComingSoon && !acc.isCreateAccount);

  // Show message if no *enabled* accounts are available
  if (!hasEnabledAccounts) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
        <h2 className="text-2xl font-bold mb-2">No Active Accounts</h2>
        <p className="text-foreground/60">
          You don&apos;t have any active accounts ready. Please complete onboarding or contact support.
        </p>
      </div>
    );
  }

  // Only show redirecting spinner if loading is done AND we have enabled accounts
  // (meaning the useEffect should be actively trying to redirect)
  return (
    <div className="flex items-center justify-center h-[calc(100vh-150px)]">
      <Spinner label="Redirecting to account..." color="primary" labelColor="primary" />
    </div>
  );
}
