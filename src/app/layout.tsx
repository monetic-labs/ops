import "@/styles/globals.css";
import { cookies } from "next/headers";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);

  return (
    <html suppressHydrationWarning lang="en">
      <body className="min-h-screen bg-zinc-300/80 font-sans antialiased">
        <AuthProvider token={authToken?.value}>
          <AccountProvider>
            <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>{children}</Providers>
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
