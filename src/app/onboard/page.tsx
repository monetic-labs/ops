"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { KYBMerchantForm } from "@/components/onboard/merchant";

// This function is used to render the onboarding page and allows us to get the email from the query params submitted from the auth input
function OnboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const router = useRouter();

  const onCancel = () => {
    router.push("/");
  };

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
