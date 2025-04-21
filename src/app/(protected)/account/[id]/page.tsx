"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/spinner";
import { useAccounts } from "@/contexts/AccountContext";
import { Account } from "../_components/Account";

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const { accounts, isLoadingAccounts } = useAccounts();

  // Find the current account based on URL
  const currentAccount = accounts.find((acc) => acc.id === params?.id);

  useEffect(() => {
    if (isLoadingAccounts || !params?.id) return;

    // If account doesn't exist, redirect to first available account
    if (!currentAccount) {
      const firstAccount = accounts.find((acc) => !acc.isDisabled && !acc.isComingSoon);
      if (firstAccount) {
        router.replace(`/account/${firstAccount.id}`);
        return;
      }
      // If no accounts available, redirect to root
      router.replace("/");
    }
  }, [accounts, currentAccount, isLoadingAccounts, params?.id, router]);

  // Show loading state while accounts are being fetched
  if (isLoadingAccounts || !currentAccount) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Spinner label="Loading Account..." color="primary" labelColor="primary" />
      </div>
    );
  }

  // Render the Account component with the current account
  return <Account account={currentAccount} isLoading={isLoadingAccounts} />;
}
