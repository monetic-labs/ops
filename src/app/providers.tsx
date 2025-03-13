"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { NextUIProvider } from "@nextui-org/system";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { PylonProvider } from "@backpack-fux/pylon-sdk";

import { MessagingProvider } from "@/components/messaging/messaging-provider";
import { ShortcutsProvider } from "@/components/generics/shortcuts-provider";
import { UsersProvider } from "@/contexts/UsersContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { SignersProvider } from "@/contexts/SignersContext";
import { isProduction } from "@/utils/helpers";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  userId?: string;
}

export function Providers({ children, themeProps, userId }: ProvidersProps) {
  const router = useRouter();
  const [queryClient] = React.useState(() => new QueryClient());

  const shortcutsInitialValue = {
    isChatOpen: false,
    openChat: () => {},
    closeChat: () => {},
    toggleChat: () => {},
  };

  return (
    // <PylonProvider pylon={pylonInstance}>
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <MessagingProvider>
            <ShortcutsProvider initialValue={shortcutsInitialValue}>
              <PrivyProvider
                appId={isProduction ? "cm85gmfvb012rwm22n8qrz403" : "cm6kflcul00yk102qos0gjism"}
                config={{
                  loginMethods: ["email", "sms"],
                  embeddedWallets: {
                    createOnLogin: "users-without-wallets",
                  },
                }}
              >
                <UsersProvider>
                  <SignersProvider>
                    <AccountProvider>{children}</AccountProvider>
                  </SignersProvider>
                </UsersProvider>
              </PrivyProvider>
            </ShortcutsProvider>
          </MessagingProvider>
        </NextThemesProvider>
      </NextUIProvider>
    </QueryClientProvider>
    // </PylonProvider>
  );
}
