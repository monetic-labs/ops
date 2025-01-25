/**
 * Protected Layout - Requires Authentication
 *
 * This layout wraps all protected routes (/, /kyb, /tabs)
 * The (protected) folder is a route group - it won't affect the URL structure
 * For example, /src/app/(protected)/page.tsx will still be accessible at '/'
 */

import { Link } from "@nextui-org/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";
import { DiscordIcon, GithubIcon, TwitterIcon } from "@/components/icons";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  if (!authToken) {
    redirect("/auth");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-8 px-6 flex-grow">{children}</main>
      <footer className="w-full flex items-center justify-center py-3 gap-4">
        <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
          <TwitterIcon className="text-default-500" />
        </Link>
        <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
          <DiscordIcon className="text-default-500" />
        </Link>
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
      </footer>
    </div>
  );
}
