"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { NextUIProvider } from "@nextui-org/system";
// import { PylonProvider } from "@backpack-fux/pylon-sdk";

import { MessagingProvider } from "@/components/messaging/messaging-provider";
import { ShortcutsProvider } from "@/components/generics/shortcuts-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  userId?: string;
}

export function Providers({ children, themeProps, userId }: ProvidersProps) {
  const router = useRouter();

  const shortcutsInitialValue = {
    isChatOpen: false,
    openChat: () => {},
    closeChat: () => {},
    toggleChat: () => {},
  };

  return (
    // <PylonProvider pylon={pylonInstance}>
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <MessagingProvider userId={userId || "default-user"}>
          <ShortcutsProvider initialValue={shortcutsInitialValue}>{children}</ShortcutsProvider>
        </MessagingProvider>
      </NextThemesProvider>
    </NextUIProvider>
    // </PylonProvider>
  );
}
