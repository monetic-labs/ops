import { Address } from "viem";

import { WebAuthnCredentials } from "@/types/webauthn";
import { FormData } from "@/validations/onboard/schemas";

export interface AuthState {
  credentials: WebAuthnCredentials;
  isLoggedIn: boolean;
}

export interface Session {
  isAuthenticated: boolean;
  lastVerified: number;
  userId?: string;
}

export interface State {
  profileImage?: string;
  selectedCredentialId?: string;
  onboarding?: OnboardingProgress;
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
  /** @description Persists data that should survive across sessions (logout/login cycles) */
  private static readonly STATE_KEY = "@monetic/ops:state";

  /** @description Temporary data that should be cleared on logout */
  private static readonly SESSION_KEY = "@monetic/ops:session";

  /** @description The expiry time for the onboarding progress in milliseconds */
  private static readonly ONBOARDING_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  /**
   * Session Management
   */

  // Define the session interface
  private static readonly DEFAULT_SESSION: Session = {
    isAuthenticated: false,
    lastVerified: 0,
  };

  // Save the session
  static saveSession(session: Session): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  // Get the session
  static getSession(): Session | null {
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
   * State Management
   */

  private static getState(): State {
    try {
      const state = localStorage.getItem(this.STATE_KEY);
      return state ? JSON.parse(state) : {};
    } catch (error) {
      console.error("Error getting state:", error);
      return {};
    }
  }

  private static setState(state: State): void {
    try {
      localStorage.setItem(this.STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error setting state:", error);
    }
  }

  /**
   * Passkey Management (stored in state)
   */

  // Save the selected credential ID
  static saveSelectedCredentialId(credentialId: string): void {
    try {
      const state = this.getState();
      this.setState({ ...state, selectedCredentialId: credentialId });
    } catch (error) {
      console.error("Error saving selected credential ID:", error);
    }
  }

  // Get the selected credential ID
  static getSelectedCredentialId(): string | null {
    try {
      const state = this.getState();
      return state.selectedCredentialId || null;
    } catch (error) {
      console.error("Error getting selected credential ID:", error);
      return null;
    }
  }

  // Clear the selected credential ID
  static clearSelectedCredentialId(): void {
    try {
      const state = this.getState();
      const { selectedCredentialId, ...rest } = state;
      this.setState(rest);
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
      const state = this.getState();
      return { profileImage: state.profileImage || null };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }

  // Set the profile image in localStorage
  static setProfileImage(image: string): void {
    try {
      const state = this.getState();
      this.setState({ ...state, profileImage: image });
    } catch (error) {
      console.error("Error setting profile image:", error);
    }
  }

  // Remove the profile image from localStorage
  static removeProfileImage(): void {
    try {
      const state = this.getState();
      const { profileImage, ...rest } = state;
      this.setState(rest);
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
      const state = this.getState();
      const existingProgress = state.onboarding || {
        currentStep: 0,
        formData: {},
        lastUpdated: Date.now(),
      };
      const progress = {
        ...existingProgress,
        ...data,
        lastUpdated: Date.now(),
      };
      this.setState({ ...state, onboarding: progress });
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
    }
  }

  // Get onboarding progress
  static getOnboardingProgress(): OnboardingProgress | null {
    try {
      const state = this.getState();
      const progress = state.onboarding;

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
      const state = this.getState();
      const { onboarding, ...rest } = state;
      this.setState(rest);
    } catch (error) {
      console.error("Error clearing onboarding progress:", error);
    }
  }
}
