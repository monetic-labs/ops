/**
 * Protected Layout - Requires Authentication
 *
 * This layout wraps all protected routes (/, /kyb, /tabs)
 * The (protected) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(protected)/page.tsx will still be accessible at '/'
 */

"use client";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Spinner } from "@heroui/spinner";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background/90 to-background/80 transition-colors overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full transition-all duration-300 ease-in-out lg:ml-[var(--sidebar-width)]">
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 pt-8 pb-20 sm:px-6 lg:pb-8 overflow-y-auto relative z-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen w-full">
                <Spinner size="lg" color="primary" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
