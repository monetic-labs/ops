/**
 * Public Layout - For Unauthenticated Routes
 *
 * This layout wraps all public routes (/auth, /onboard)
 * The (public) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(public)/auth/page.tsx will still be accessible at '/auth'
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  if (authToken) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-zinc-800 sm:bg-gradient-to-br sm:from-charyo-950 sm:via-charyo-900 sm:to-notpurple-900">
      {/* Background Image - Hidden on mobile */}
      {/* <div className="hidden sm:block absolute inset-0">
        <Image
          fill
          priority
          unoptimized
          alt="Background"
          className="object-cover opacity-20 pointer-events-none"
          src="/bg-celestial.png"
        />
      </div> */}
      {children}
    </div>
  );
}
