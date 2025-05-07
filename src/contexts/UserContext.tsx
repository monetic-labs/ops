"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MerchantUserGetByIdOutput as MerchantUser, MerchantUserUpdateInput } from "@monetic-labs/sdk";
import { Hex } from "viem";
import { PublicKey } from "ox";

import pylon from "@/libs/monetic-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";
import { LocalStorage } from "@/utils/localstorage";
import { CookieManager } from "@/utils/cookie-manager";
import { BridgeComplianceKycStatus, RainComplianceKybStatus } from "@monetic-labs/sdk";

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
  isFullyApproved: boolean;
  isMigrationRequired: boolean;
}

interface UserContextType extends UserState {
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  getCredentials: () => WebAuthnCredentials[] | undefined;
  addCredential: (credential: WebAuthnCredentials) => void;
  updateProfileImage: (image: string | null) => Promise<void>;
  updateUserDetails: (payload: MerchantUserUpdateInput) => Promise<void>;
  forceAuthCheck: () => Promise<boolean>;
  dismissMigrationPrompt: () => void;
}

const defaultState: UserContextType = {
  user: undefined,
  credentials: undefined,
  authStatus: AuthStatus.INITIALIZING,
  isLoading: true,
  isAuthenticated: false,
  isFullyApproved: false,
  isMigrationRequired: false,
  logout: async () => {},
  getCredentials: () => undefined,
  addCredential: () => {},
  updateProfileImage: async () => {},
  updateUserDetails: async () => {},
  forceAuthCheck: async () => false,
  dismissMigrationPrompt: () => {},
};

const UserContext = createContext<UserContextType>(defaultState);

const PUBLIC_ROUTES = ["/auth", "/invite", "/onboard"];

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
  const [isFullyApproved, setIsFullyApproved] = useState<boolean>(false);
  const [isMigrationRequired, setIsMigrationRequired] = useState<boolean>(false);

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

      // Fetch compliance status concurrently
      const compliancePromise = fetch("/api/check-compliance");

      if (!userData) {
        // No user found
        setUser(undefined);
        setCredentials(undefined);
        setIsFullyApproved(false);
        setIsMigrationRequired(false);

        // Clear compliance cookie
        CookieManager.clearComplianceStatus();

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

      // Check for Passkey Migration Need
      const needsMigration = userData?.hasMigratedPasskey === false;
      setIsMigrationRequired(needsMigration);

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

      // Process compliance status concurrently
      try {
        const complianceRes = await compliancePromise;
        if (complianceRes.ok) {
          const status = await complianceRes.json();
          const approved =
            status?.kycStatus?.toUpperCase() === BridgeComplianceKycStatus.APPROVED.toUpperCase() &&
            status?.rainKybStatus?.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase() &&
            (!status?.rainKycStatus ||
              status.rainKycStatus.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase());

          setIsFullyApproved(approved);
          CookieManager.setComplianceStatus(status);
        } else {
          console.error("Failed to fetch compliance status:", complianceRes.statusText);
          setIsFullyApproved(false);
          CookieManager.setComplianceStatus({
            kycStatus: "",
            rainKybStatus: "",
          });
        }
      } catch (error) {
        console.error("Error fetching or processing compliance status:", error);
        setIsFullyApproved(false);
        CookieManager.setComplianceStatus({
          kycStatus: "",
          rainKybStatus: "",
        });
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
      setIsFullyApproved(false);
      setIsMigrationRequired(false);
      CookieManager.setComplianceStatus({
        kycStatus: "",
        rainKybStatus: "",
      });
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
      setIsFullyApproved(false);
      setIsMigrationRequired(false);
      CookieManager.clearComplianceStatus();

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
      setIsFullyApproved(false);
      setIsMigrationRequired(false);
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

  // Function to dismiss the migration prompt
  const dismissMigrationPrompt = () => {
    setIsMigrationRequired(false);
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
      isFullyApproved,
      isMigrationRequired,
      profile,
      logout: handleLogout,
      getCredentials: () => credentials,
      addCredential: handleAddCredential,
      forceAuthCheck,
      dismissMigrationPrompt,
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
      updateUserDetails: async (payload: MerchantUserUpdateInput) => {
        if (!user?.id) {
          throw new Error("User ID is missing, cannot update details.");
        }
        try {
          // Call the SDK function
          await pylon.updateUser(user.id, payload);

          // Update the user state by refetching the full user data
          await checkAuthentication();
        } catch (error) {
          console.error("Error updating user details:", error);
          // Re-throw the error to be caught by the calling component
          throw error;
        }
      },
    }),
    [
      user,
      credentials,
      authStatus,
      isLoading,
      isAuthenticated,
      isFullyApproved,
      isMigrationRequired,
      profile,
      forceAuthCheck,
    ]
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
