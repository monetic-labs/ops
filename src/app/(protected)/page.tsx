"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";

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
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Spinner label="Loading Accounts..." color="primary" labelColor="primary" />
      </div>
    );
  }

  // Show message if no accounts are available
  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
        <h2 className="text-2xl font-bold mb-2">No Accounts Available</h2>
        <p className="text-foreground/60">
          You don&apos;t have any accounts set up yet. Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  // This should rarely be seen as we redirect to account page
  return (
    <div className="flex items-center justify-center h-[calc(100vh-150px)]">
      <Spinner label="Redirecting to account..." color="primary" labelColor="primary" />
    </div>
  );
}
