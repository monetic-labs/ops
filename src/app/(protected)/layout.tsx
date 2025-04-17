/**
 * Protected Layout - Requires Authentication
 *
 * This layout wraps all protected routes (/, /kyb, /tabs)
 * The (protected) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(protected)/page.tsx will still be accessible at '/'
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  if (!authToken) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background/90 to-background/80 transition-colors">
      <Sidebar />

      <div className="flex flex-col flex-1 w-full lg:ml-64">
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 pt-8 pb-20 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
