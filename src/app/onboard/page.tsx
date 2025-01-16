"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { KYBMerchantForm } from "@/components/onboard/merchant";

function OnboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  return <KYBMerchantForm initialEmail={email} />;
}

export default function OnboardPage() {
  return (
    <section className="relative">
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardContent />
      </Suspense>
    </section>
  );
}
