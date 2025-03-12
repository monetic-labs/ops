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
  private static KEY = "@backpack/state";
  private static ONBOARDING_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Onboarding Methods
  static saveOnboardingProgress(data: Partial<OnboardingProgress>) {
    const existing = this.getOnboardingProgress();
    const progress = {
      ...existing,
      ...data,
      lastUpdated: Date.now(),
    };

    this.set("onboarding", progress);
    this.dispatchStorageChange();
  }

  static getOnboardingProgress(): OnboardingProgress | null {
    const progress = this.get("onboarding");

    if (!progress) return null;

    // Check if the data is expired (24 hours)
    if (Date.now() - progress.lastUpdated > this.ONBOARDING_EXPIRY) {
      this.clearOnboardingProgress();
      return null;
    }

    return progress;
  }

  static clearOnboardingProgress() {
    const data = localStorage.getItem(this.KEY);
    if (!data) return;

    const parsed = JSON.parse(data);
    delete parsed.onboarding;

    localStorage.setItem(this.KEY, JSON.stringify(parsed));
    this.dispatchStorageChange();
  }

  // User Profile Methods
  static setProfileImage(image: string) {
    const profile = this.getProfile() || {};

    this.set("profile", {
      ...profile,
      profileImage: image,
    });
    this.dispatchStorageChange();
  }

  static getProfile(): UserProfile | null {
    return this.get("profile");
  }

  static removeProfileImage() {
    const profile = this.getProfile() || {};
    const { profileImage, ...rest } = profile;

    this.set("profile", rest);
    this.dispatchStorageChange();
  }

  // Private Helper Methods
  private static set(key: string, value: any) {
    if (typeof localStorage === "undefined") return;
    const existingData = localStorage.getItem(this.KEY);
    const data = existingData ? JSON.parse(existingData) : {};

    data[key] = value;
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  private static get(key: string): any {
    if (typeof localStorage === "undefined") return null;
    const data = localStorage.getItem(this.KEY);

    if (!data) return null;
    const parsed = JSON.parse(data);

    return parsed[key] || null;
  }

  private static dispatchStorageChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  }
}
