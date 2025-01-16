"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardForm } from "@/components/onboard/onboard-form";

export default function OnboardPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  return (
    <section className="relative">
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardForm email={email} />
      </Suspense>
    </section>
  );
}
