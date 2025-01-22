"use client";
import { createContext, useContext, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  userId: string;
  merchantId: number;
  sessionId: string;
  iat: number;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userId?: string;
  merchantId?: number;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
});

export function AuthProvider({ children, token }: { children: ReactNode; token?: string }) {
  let contextValue: AuthContextType = {
    isAuthenticated: false,
  };

  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);

      contextValue = {
        isAuthenticated: true,
        userId: decoded.userId,
        merchantId: decoded.merchantId,
      };
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
