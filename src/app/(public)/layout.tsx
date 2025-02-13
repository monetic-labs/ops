/**
 * Public Layout - For Unauthenticated Routes
 *
 * This layout wraps all public routes (/auth, /onboard)
 * The (public) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(public)/auth/page.tsx will still be accessible at '/auth'
 */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Main content */}
        <div className="min-h-screen">{children}</div>
      </div>
    </main>
  );
}
