"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";
import { LocalStorage, AuthState, WebAuthnCredentials, UserProfile, OnboardingState } from "@/utils/localstorage";

interface JwtPayload {
  userId: string;
  merchantId: number;
  sessionId: string;
  iat: number;
  exp: number;
}

interface UserState {
  user: MerchantUser | undefined;
  credentials: WebAuthnCredentials | undefined;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId?: string;
  merchantId?: number;
}

interface UserContextType extends UserState {
  logout: () => void;
  getSigningCredentials: () => WebAuthnCredentials | undefined;
  updateProfileImage: (image: string | null) => void;
  setAuth: (auth: AuthState) => void;
  setOnboarding: (state: OnboardingState) => void;
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  credentials: undefined,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  userId: undefined,
  merchantId: undefined,
  logout: () => {},
  getSigningCredentials: () => undefined,
  updateProfileImage: () => {},
  setAuth: () => {},
  setOnboarding: () => {},
});

const PUBLIC_ROUTES = ["/auth", "/auth/recovery", "/invite", "/onboard"];

export function UserProvider({ children, token }: { children: ReactNode; token?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  // Core state
  const [user, setUser] = useState<MerchantUser | undefined>();
  const [authState, setAuthState] = useState<AuthState | null>(LocalStorage.getAuth());
  const [profile, setProfile] = useState<UserProfile | null>(LocalStorage.getProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [merchantId, setMerchantId] = useState<number | undefined>();

  // Process JWT token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUserId(decoded.userId);
        setMerchantId(decoded.merchantId);
      } catch (error) {
        console.error("Failed to decode JWT:", error);
      }
    }
  }, [token]);

  // Derived state
  const isAuthenticated = Boolean(authState?.isLoggedIn && user);
  const credentials = authState?.credentials;

  // Fetch user data when authenticated
  useEffect(() => {
    const fetchUser = async () => {
      if (!authState?.isLoggedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await pylon.getUserById();
        setUser(result);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if ((error as any)?.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [authState?.isLoggedIn]);

  // Auth state change listener
  useEffect(() => {
    const handleStorageChange = () => {
      const newAuthState = LocalStorage.getAuth();
      const newProfile = LocalStorage.getProfile();

      setAuthState(newAuthState);
      setProfile(newProfile);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChange", handleStorageChange);
    };
  }, []);

  // Route protection
  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    if (isLoading) return;

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/auth");
    } else if (isAuthenticated && isPublicRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const handleLogout = async () => {
    try {
      await pylon.logout();
      LocalStorage.clearAuth();
      setAuthState((prev) => {
        setUser(undefined);
        setUserId(undefined);
        setMerchantId(undefined);
        return null;
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      router.replace("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getSigningCredentials = (): WebAuthnCredentials | undefined => {
    if (!authState?.credentials) return undefined;
    return authState.credentials;
  };

  const updateProfileImage = (image: string | null) => {
    if (image) {
      LocalStorage.setProfileImage(image);
    } else {
      LocalStorage.removeProfileImage();
    }
  };

  const setAuth = (auth: AuthState) => {
    LocalStorage.setAuth(auth.credentials, auth.isLoggedIn);
    setAuthState(auth);
  };

  const setOnboarding = (state: OnboardingState) => {
    LocalStorage.setOnboarding(state);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        credentials,
        profile,
        isLoading,
        isAuthenticated,
        userId,
        merchantId,
        logout: handleLogout,
        getSigningCredentials,
        updateProfileImage,
        setAuth,
        setOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
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
