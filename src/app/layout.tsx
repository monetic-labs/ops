import "@/styles/globals.css";
import { Link } from "@nextui-org/link";
import clsx from "clsx";
import { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { Navbar } from "@/components/navbar";
import { fontSans } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { Providers } from "./providers";
import { AccountProvider } from "@/contexts/AccountContext";
import { DiscordIcon, GithubIcon, TwitterIcon } from "@/components/icons";
import { AuthProvider } from "@/contexts/AuthContext";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <AuthProvider token={authToken?.value}>
          <AccountProvider>
            <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
              <div className="relative flex flex-col h-screen">
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
            </Providers>
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
