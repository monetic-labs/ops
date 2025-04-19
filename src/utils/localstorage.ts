import { Address } from "viem";

import { WebAuthnCredentials } from "@/types/webauthn";
import { FormData } from "@/validations/onboard/schemas";

export interface AuthState {
  credentials: WebAuthnCredentials;
  isLoggedIn: boolean;
}

export interface OnboardingState {
  credentials: WebAuthnCredentials;
  walletAddress: Address;
  settlementAddress: Address;
}

export interface UserProfile {
  profileImage?: string;
}

export interface OnboardingProgress {
  currentStep: number;
  formData: Partial<FormData>;
  lastUpdated: number;
  token?: string;
  requirementsShown?: boolean;
}

export class LocalStorage {
  private static readonly STATE_KEY = "@monetic/ops:state";
  private static readonly PASSKEY_KEY = "@monetic/ops:state:passkey";
  private static readonly SESSION_KEY = "@monetic/ops:session";
  private static readonly ONBOARDING_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  /**
   * Session Management
   */

  // Define the session interface
  private static readonly DEFAULT_SESSION = {
    isAuthenticated: false,
    lastVerified: 0,
  };

  // Save the session
  static saveSession(session: { isAuthenticated: boolean; lastVerified: number; userId?: string }): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  // Get the session
  static getSession(): { isAuthenticated: boolean; lastVerified: number; userId?: string } | null {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  // Clear the session
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }

  /**
   * Passkey Management
   */

  // Save the selected credential ID
  static saveSelectedCredentialId(credentialId: string): void {
    try {
      localStorage.setItem(this.PASSKEY_KEY, credentialId);
    } catch (error) {
      console.error("Error saving selected credential ID:", error);
    }
  }

  // Get the selected credential ID
  static getSelectedCredentialId(): string | null {
    try {
      return localStorage.getItem(this.PASSKEY_KEY);
    } catch (error) {
      console.error("Error getting selected credential ID:", error);
      return null;
    }
  }

  // Clear the selected credential ID
  static clearSelectedCredentialId(): void {
    try {
      localStorage.removeItem(this.PASSKEY_KEY);
    } catch (error) {
      console.error("Error clearing selected credential ID:", error);
    }
  }

  /**
   * Profile Management
   */

  // Get the profile from localStorage
  static getProfile(): { profileImage: string | null } | null {
    try {
      const state = localStorage.getItem(this.STATE_KEY);

      if (!state) {
        return null;
      }

      const parsedState = JSON.parse(state);

      return { profileImage: parsedState.profileImage || null };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }

  // Set the profile image in localStorage
  static setProfileImage(image: string): void {
    try {
      const state = localStorage.getItem(this.STATE_KEY);
      const parsedState = state ? JSON.parse(state) : {};

      parsedState.profileImage = image;

      localStorage.setItem(this.STATE_KEY, JSON.stringify(parsedState));
    } catch (error) {
      console.error("Error setting profile image:", error);
    }
  }

  // Remove the profile image from localStorage
  static removeProfileImage(): void {
    try {
      const state = localStorage.getItem(this.STATE_KEY);

      if (!state) {
        return;
      }

      const parsedState = JSON.parse(state);

      delete parsedState.profileImage;

      localStorage.setItem(this.STATE_KEY, JSON.stringify(parsedState));
    } catch (error) {
      console.error("Error removing profile image:", error);
    }
  }

  /**
   * Onboarding Management
   */

  // Save onboarding progress
  static saveOnboardingProgress(data: Partial<OnboardingProgress>) {
    try {
      const existing = this.getOnboardingProgress();
      const progress = {
        ...existing,
        ...data,
        lastUpdated: Date.now(),
      };

      this.set("onboarding", progress);
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
    }
  }

  // Get onboarding progress
  static getOnboardingProgress(): OnboardingProgress | null {
    try {
      const progress = this.get("onboarding");

      if (!progress) return null;

      // Check if the data is expired
      if (Date.now() - progress.lastUpdated > this.ONBOARDING_EXPIRY) {
        this.clearOnboardingProgress();
        return null;
      }

      return progress;
    } catch (error) {
      console.error("Error getting onboarding progress:", error);
      return null;
    }
  }

  // Clear onboarding progress
  static clearOnboardingProgress() {
    try {
      const data = localStorage.getItem(this.STATE_KEY);

      if (!data) return;

      const parsed = JSON.parse(data);

      delete parsed.onboarding;

      localStorage.setItem(this.STATE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error("Error clearing onboarding progress:", error);
    }
  }

  /**
   * Private Helper Methods
   */

  private static set(key: string, value: any) {
    try {
      const existingData = localStorage.getItem(this.STATE_KEY);
      const data = existingData ? JSON.parse(existingData) : {};

      data[key] = value;
      localStorage.setItem(this.STATE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  }

  private static get(key: string): any {
    try {
      const data = localStorage.getItem(this.STATE_KEY);

      if (!data) return null;
      const parsed = JSON.parse(data);

      return parsed[key] || null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }
}
