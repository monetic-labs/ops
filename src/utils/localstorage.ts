import { Address } from "viem";

import { WebAuthnCredentials } from "@/types/webauthn";

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

export class LocalStorage {
  private static KEY = "@backpack/state";

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
