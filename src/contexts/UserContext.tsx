"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
import { Hex } from "viem";
import { PublicKey } from "ox";

import pylon from "@/libs/pylon-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";

interface UserState {
  user: MerchantUser | undefined;
  credentials: WebAuthnCredentials | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UserContextType extends UserState {
  logout: () => void;
  getSigningCredentials: () => WebAuthnCredentials | undefined;
  setCredentials: (credentials: WebAuthnCredentials) => void;
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  credentials: undefined,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  getSigningCredentials: () => undefined,
  setCredentials: () => {},
});

const PUBLIC_ROUTES = ["/auth", "/auth/recovery", "/invite", "/onboard"];

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Core state
  const [user, setUser] = useState<MerchantUser | undefined>();
  const [credentials, setCredentials] = useState<WebAuthnCredentials | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(true);

  // Check auth status and fetch user data
  useEffect(() => {
    let isSubscribed = true;

    const checkAuthStatus = async () => {
      // Don't check if we shouldn't
      if (!shouldCheckAuth) {
        setIsLoading(false);
        return;
      }

      // Skip auth check if we're on the verify route (token exchange in progress)
      if (pathname?.startsWith("/auth/verify")) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await pylon.getUserById();
        if (!isSubscribed) return;

        if (!userData) {
          setUser(undefined);
          setCredentials(undefined);
          setIsLoading(false);
          setShouldCheckAuth(false);
          return;
        }

        setUser(userData);

        // If we have registered passkeys but no credentials set, use the first one
        if (!credentials && userData?.registeredPasskeys?.length > 0) {
          const passkey = userData.registeredPasskeys[0];
          const { x, y } = PublicKey.fromHex(passkey.publicKey as Hex);
          setCredentials({
            publicKey: { x, y },
            credentialId: passkey.credentialId,
          });
        }

        setIsLoading(false);
        setShouldCheckAuth(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (!isSubscribed) return;

        setUser(undefined);
        setCredentials(undefined);
        setIsLoading(false);
        setShouldCheckAuth(false);
      }
    };

    checkAuthStatus();

    return () => {
      isSubscribed = false;
    };
  }, [pathname, shouldCheckAuth]);

  const handleLogout = async () => {
    try {
      await pylon.logout();
      setUser(undefined);
      setCredentials(undefined);
      setShouldCheckAuth(false);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSetCredentials = (newCredentials: WebAuthnCredentials) => {
    setShouldCheckAuth(true);
    setCredentials(newCredentials);
  };

  // Simplified route protection using early returns
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    const hasOnboardToken = pathname?.startsWith("/onboard") && searchParams?.get("token");
    const isVerifyRoute = pathname?.startsWith("/auth/verify");

    // Skip protection for special cases
    if (isVerifyRoute || hasOnboardToken) return;

    // Handle routing
    if (!isPublicRoute && !user) {
      router.replace("/auth");
    } else if (user && isPublicRoute) {
      router.replace("/");
    }
  }, [user, isLoading, pathname, router, searchParams]);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      user,
      credentials,
      isLoading,
      isAuthenticated: Boolean(user),
      logout: handleLogout,
      getSigningCredentials: () => credentials,
      setCredentials: handleSetCredentials,
    }),
    [user, credentials, isLoading]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const useSigningCredentials = () => {
  const { getSigningCredentials } = useUser();
  return getSigningCredentials();
};
