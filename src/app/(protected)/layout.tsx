/**
 * Protected Layout - Requires Authentication
 *
 * This layout wraps all protected routes (/, /kyb, /tabs)
 * The (protected) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(protected)/page.tsx will still be accessible at '/'
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Navbar } from "@/components/navbar";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  if (!authToken) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-charyo-900 py-2">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="w-full max-w-[1440px] mx-auto px-6 py-4">
          <Navbar />
        </div>
      </div>
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-6">
        <div className="pt-[92px] pb-4 space-y-4">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
