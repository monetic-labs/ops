"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { title } from "@/components/primitives";
import { KYBMerchantForm } from "@/components/onboard/merchant";
import { useRouter } from "next/navigation";

// This function is used to render the onboarding page and allows us to get the email from the query params submitted from the auth input
function OnboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const router = useRouter();

  const onCancel = () => {
    router.push("/");
  };

  return (
    <KYBMerchantForm initialEmail={email} onCancel={onCancel} />
  );
}

export default function OnboardPage() {
  return (
    <section className="relative">
      <div className="text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Onboarding</h1>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardContent />

      </Suspense>
    </section>
  );
}
