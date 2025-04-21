"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { HeroUIProvider } from "@heroui/system";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
// import { PylonProvider } from "@monetic-labs/sdk";

import { MessagingProvider } from "@/components/messaging/messaging-provider";
import { ShortcutsProvider } from "@/components/generics/shortcuts-provider";
import { UsersProvider } from "@/contexts/UsersContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { SignersProvider } from "@/contexts/SignersContext";
import { PasskeySelectionProvider } from "@/contexts/PasskeySelectionContext";
import { PasskeySelectionModal } from "@/components/generics/passkey-selection-modal";
import { isProduction } from "@/utils/helpers";
import { useState } from "react";
import { useTheme } from "@/hooks/generics/useTheme";
import { useMediaQuery } from "@/hooks/onboard/useMediaQuery";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  userId?: string;
}

export function Providers({ children, themeProps, userId }: ProvidersProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 870px)");
  const { isDark } = useTheme();
  const [queryClient] = useState(() => new QueryClient());

  const shortcutsInitialValue = {
    isChatOpen: false,
    openChat: () => {},
    closeChat: () => {},
    toggleChat: () => {},
  };

  return (
    // <PylonProvider pylon={pylonInstance}>
    // </PylonProvider>
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <Toaster
            position={isMobile ? "top-center" : "bottom-right"}
            theme={isDark ? "dark" : "light"}
            closeButton
            richColors
          />
          <MessagingProvider>
            <ShortcutsProvider initialValue={shortcutsInitialValue}>
              <PrivyProvider
                appId={isProduction ? "cm85gmfvb012rwm22n8qrz403" : "cm6kflcul00yk102qos0gjism"}
                clientId={isProduction ? "client-WY5hqrV6F9aaGAzjh5pznYyH9Vbwb1dWf2r6KD479P2kh" : undefined}
                config={{
                  loginMethods: ["email", "sms"],
                  embeddedWallets: {
                    createOnLogin: "users-without-wallets",
                  },
                }}
              >
                <UsersProvider>
                  <SignersProvider>
                    <PasskeySelectionProvider>
                      <AccountProvider>
                        {children}
                        <PasskeySelectionModal />
                      </AccountProvider>
                    </PasskeySelectionProvider>
                  </SignersProvider>
                </UsersProvider>
              </PrivyProvider>
            </ShortcutsProvider>
          </MessagingProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
