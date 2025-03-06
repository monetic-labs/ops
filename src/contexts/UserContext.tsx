"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
import { Hex } from "viem";
import { PublicKey } from "ox";

import pylon from "@/libs/pylon-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";
import { LocalStorage } from "@/utils/localstorage";

interface UserState {
  user: MerchantUser | undefined;
  credentials: WebAuthnCredentials | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile?: {
    profileImage: string | null;
  };
}

interface UserContextType extends UserState {
  logout: () => void;
  getSigningCredentials: () => WebAuthnCredentials | undefined;
  setCredentials: (credentials: WebAuthnCredentials) => void;
  updateProfileImage: (image: string | null) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  credentials: undefined,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  getSigningCredentials: () => undefined,
  setCredentials: () => {},
  updateProfileImage: async () => {},
});

const PUBLIC_ROUTES = ["/auth", "/auth/recovery", "/invite", "/onboard"];

interface UserProviderProps {
  children: ReactNode;
  token?: string;
}

export function UserProvider({ children, token }: UserProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Core state
  const [user, setUser] = useState<MerchantUser | undefined>();
  const [credentials, setCredentials] = useState<WebAuthnCredentials | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(Boolean(token));
  const [profile, setProfile] = useState<UserState["profile"]>();

  // Load profile from localStorage on mount and listen for changes
  useEffect(() => {
    const savedProfile = LocalStorage.getProfile();

    if (savedProfile) {
      setProfile({ profileImage: savedProfile.profileImage || null });
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const updatedProfile = LocalStorage.getProfile();

      if (updatedProfile) {
        setProfile({ profileImage: updatedProfile.profileImage || null });
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
        setIsLoading(true);
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

        // Add a small delay to ensure state updates are processed
        await new Promise((resolve) => setTimeout(resolve, 500));

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
  }, [pathname, shouldCheckAuth, credentials]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await pylon.logout();
      setUser(undefined);
      setCredentials(undefined);
      setShouldCheckAuth(false);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCredentials = (newCredentials: WebAuthnCredentials) => {
    setIsLoading(true);
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
      profile,
      logout: handleLogout,
      getSigningCredentials: () => credentials,
      setCredentials: handleSetCredentials,
      updateProfileImage: async (image: string | null) => {
        try {
          // Update localStorage first
          if (image) {
            LocalStorage.setProfileImage(image);
          } else {
            LocalStorage.removeProfileImage();
          }

          // Then update the state
          setProfile((prev) => ({ ...prev, profileImage: image }));

          return Promise.resolve();
        } catch (error) {
          console.error("Error updating profile image:", error);

          return Promise.reject(error);
        }
      },
    }),
    [user, credentials, isLoading, profile]
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
