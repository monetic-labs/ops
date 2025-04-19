"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MerchantUserGetByIdOutput as MerchantUser } from "@monetic-labs/sdk";
import { Hex } from "viem";
import { PublicKey } from "ox";

import pylon from "@/libs/pylon-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";
import { LocalStorage } from "@/utils/localstorage";

// Define authentication status enum
export enum AuthStatus {
  INITIALIZING = "initializing",
  CHECKING = "checking",
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  LOGGING_OUT = "logging-out",
}

// Session interface for localStorage
interface Session {
  isAuthenticated: boolean;
  lastVerified: number;
  userId?: string;
}

interface UserState {
  user: MerchantUser | undefined;
  credentials: WebAuthnCredentials[] | undefined;
  authStatus: AuthStatus;
  profile?: {
    profileImage: string | null;
  };
}

interface UserContextType extends UserState {
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  getCredentials: () => WebAuthnCredentials[] | undefined;
  addCredential: (credential: WebAuthnCredentials) => void;
  updateProfileImage: (image: string | null) => Promise<void>;
  forceAuthCheck: () => Promise<boolean>;
}

const defaultState: UserContextType = {
  user: undefined,
  credentials: undefined,
  authStatus: AuthStatus.INITIALIZING,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
  getCredentials: () => undefined,
  addCredential: () => {},
  updateProfileImage: async () => {},
  forceAuthCheck: async () => false,
};

const UserContext = createContext<UserContextType>(defaultState);

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
  const [credentials, setCredentials] = useState<WebAuthnCredentials[] | undefined>();
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.INITIALIZING);
  const [profile, setProfile] = useState<UserState["profile"]>();
  const [session, setSession] = useState<Session | null>(null);

  // Derived states
  const isLoading = authStatus === AuthStatus.INITIALIZING || authStatus === AuthStatus.CHECKING;
  const isAuthenticated = authStatus === AuthStatus.AUTHENTICATED;

  // Load saved session on mount
  useEffect(() => {
    try {
      const savedSession = LocalStorage.getSession();
      if (savedSession) {
        setSession(savedSession);
        if (savedSession.isAuthenticated) {
          setAuthStatus(AuthStatus.CHECKING);
        } else {
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
        }
      } else {
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
      }
    } catch (error) {
      console.error("Error loading saved session:", error);
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
    }
  }, []);

  // Load profile from localStorage
  useEffect(() => {
    try {
      const savedProfile = LocalStorage.getProfile();
      if (savedProfile) {
        setProfile({ profileImage: savedProfile.profileImage || null });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, []);

  // Core authentication check function
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      setAuthStatus(AuthStatus.CHECKING);

      const userData = await pylon.getUserById();

      if (!userData) {
        // No user found
        setUser(undefined);
        setCredentials(undefined);

        const newSession: Session = {
          isAuthenticated: false,
          lastVerified: Date.now(),
        };
        LocalStorage.saveSession(newSession);
        setSession(newSession);

        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        return false;
      }

      // User found
      setUser(userData);

      // Process credentials if needed
      if (!credentials && userData?.registeredPasskeys?.length > 0) {
        try {
          const credentialsArray = userData.registeredPasskeys.map((passkey) => {
            const { x, y } = PublicKey.fromHex(passkey.publicKey as Hex);
            return {
              publicKey: { x, y },
              credentialId: passkey.credentialId,
            };
          });
          setCredentials(credentialsArray);
        } catch (error) {
          console.error("Error processing credentials:", error);
        }
      }

      // Update session
      const newSession: Session = {
        isAuthenticated: true,
        lastVerified: Date.now(),
        userId: userData.id,
      };
      LocalStorage.saveSession(newSession);
      setSession(newSession);

      setAuthStatus(AuthStatus.AUTHENTICATED);
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);

      // Update session as unauthenticated
      const newSession: Session = {
        isAuthenticated: false,
        lastVerified: Date.now(),
      };
      LocalStorage.saveSession(newSession);
      setSession(newSession);

      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      return false;
    }
  };

  // Public function to force auth check
  const forceAuthCheck = async (): Promise<boolean> => {
    return await checkAuthentication();
  };

  // Run auth check when needed
  useEffect(() => {
    if (authStatus === AuthStatus.INITIALIZING) {
      // Skip auth check if we're on the verify route, handled separately
      if (pathname?.startsWith("/auth/verify")) {
        return;
      }

      // Skip if we loaded a saved session
      if (session !== null) {
        return;
      }

      // If we have no session yet, check auth
      checkAuthentication();
    }
  }, [authStatus, pathname, session]);

  // Logout function
  const handleLogout = async () => {
    try {
      setAuthStatus(AuthStatus.LOGGING_OUT);

      // Clear passkey data
      LocalStorage.clearSelectedCredentialId();

      // Clear session
      LocalStorage.clearSession();
      setSession(null);

      // Call API logout
      await pylon.logout();

      // Clear state
      setUser(undefined);
      setCredentials(undefined);
      setAuthStatus(AuthStatus.UNAUTHENTICATED);

      // Redirect after logout
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);

      // Even on error, clean up local state
      LocalStorage.clearSession();
      setSession(null);
      setUser(undefined);
      setCredentials(undefined);
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
    }
  };

  // Handle credential addition
  const handleAddCredential = (newCredential: WebAuthnCredentials) => {
    // Add to credentials array
    setCredentials((prev) => {
      // If array doesn't exist yet, create it with the new credential
      if (!prev) return [newCredential];

      // Check if credential already exists by credentialId
      const exists = prev.some((cred) => cred.credentialId === newCredential.credentialId);
      if (exists) {
        // Replace the existing credential
        return prev.map((cred) => (cred.credentialId === newCredential.credentialId ? newCredential : cred));
      }

      // Add the new credential to the array
      return [...prev, newCredential];
    });

    // Force auth check as credentials changed
    checkAuthentication();
  };

  // Handle routing based on auth state
  useEffect(() => {
    // Skip if still initializing/checking or logging out
    if (isLoading || authStatus === AuthStatus.LOGGING_OUT) {
      return;
    }

    // Skip for special paths
    const isVerifyRoute = pathname?.startsWith("/auth/verify");
    const hasOnboardToken = pathname?.startsWith("/onboard") && searchParams?.get("token");
    if (isVerifyRoute || hasOnboardToken) {
      return;
    }

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    // Handle routing based on auth state
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/auth");
    } else if (isAuthenticated && isPublicRoute && !pathname?.startsWith("/invite")) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, authStatus, pathname, router, searchParams]);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      user,
      credentials,
      authStatus,
      isLoading,
      isAuthenticated,
      profile,
      logout: handleLogout,
      getCredentials: () => credentials,
      addCredential: handleAddCredential,
      forceAuthCheck,
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
    [user, credentials, authStatus, isLoading, isAuthenticated, profile, forceAuthCheck]
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

export const useCredentials = () => {
  const { getCredentials } = useUser();
  return getCredentials();
};

export const useCredentialIds = () => {
  const credentials = useCredentials();
  return credentials?.map((cred) => cred.credentialId) || [];
};
