"use client";

import { useEffect, useState } from "react";

import AccountOverview from "@/components/account-contract/account-meta";
import MerchantServicesTabs from "./tabs";
import pylon from "@/libs/pylon-sdk";

export default function DashboardPage() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const result = await pylon.getUserById();
      setUserId(result.id);
    };

    fetchUser();
  }, []);

  return (
    <>
      {/* Account Overview Card */}
      <AccountOverview />

      {/* Services Tabs Card */}
      <MerchantServicesTabs userId={userId} />
    </>
  );
}
