"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";

import { NextUIProvider } from "@nextui-org/system";
import { PylonProvider } from "@backpack-fux/pylon-sdk";

import pylonInstance from "@/libs/pylon-sdk";
import PageWithScrollBackground from "@/styles/framer-motion/scroll-wrapper";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <PylonProvider pylon={pylonInstance}>
      <NextUIProvider navigate={router.push}>
          <NextThemesProvider {...themeProps}>
            <PageWithScrollBackground>{children}</PageWithScrollBackground>
          </NextThemesProvider>
      </NextUIProvider>
    </PylonProvider>
  );
}
