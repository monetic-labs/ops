"use client";

import AccountMeta from "@/components/account-contract/account-meta";
import MerchantServicesTabs from "./tabs";
import { useUser } from "@/contexts/UserContext";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <>
      {/* Account Overview Card */}
      <AccountMeta />

      {/* Services Tabs Card */}
      <MerchantServicesTabs userId={user?.id || ""} />
    </>
  );
}
