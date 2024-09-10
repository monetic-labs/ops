"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { title } from "@/components/primitives";
import { FormCompanyInfo } from "@/components/onboard/form-company-info";

// This function is used to render the onboarding page and allows us to get the email from the query params submitted from the auth input
function OnboardContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-7xl justify-between mb-8">
      <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
        <FormCompanyInfo />
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Onboarding</h1>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardContent />
      </Suspense>
    </section>
  );
}
