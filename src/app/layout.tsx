import "@/styles/globals.css";
import { cookies } from "next/headers";

import { UserProvider } from "@/contexts/UserContext";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  return (
    <html suppressHydrationWarning lang="en">
      <body className="min-h-screen font-sans antialiased bg-background text-foreground dark:bg-gradient-to-br dark:from-charyo-950 dark:via-charyo-900 dark:to-notpurple-900">
        <UserProvider token={authToken?.value}>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark", themes: ["light", "dark"] }}>
            {children}
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}
