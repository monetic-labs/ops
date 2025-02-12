import { Address } from "viem";

// Define clear interfaces
export interface WebAuthnCredentials {
  publicKey: {
    x: bigint;
    y: bigint;
  };
  credentialId: string;
}

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

  private static replacer(key: string, value: any) {
    return typeof value === "bigint" ? value.toString() : value;
  }

  private static reviver(key: string, value: any) {
    return typeof value === "string" && /^-?\d+n?$/.test(value) ? BigInt(value.replace("n", "")) : value;
  }

  // Core Authentication Methods
  static setAuth(credentials: WebAuthnCredentials, isLoggedIn: boolean) {
    const state = {
      credentials,
      isLoggedIn,
      timestamp: Date.now(),
    };

    this.set("auth", state);
    this.dispatchAuthChange();
  }

  static getAuth(): AuthState | null {
    return this.get("auth");
  }

  static clearAuth() {
    this.remove("auth");
    this.dispatchAuthChange();
  }

  // Onboarding Methods (Temporary State)
  static setOnboarding(state: OnboardingState) {
    this.set("onboarding", { ...state, timestamp: Date.now() });
  }

  static getOnboarding(): OnboardingState | null {
    return this.get("onboarding");
  }

  static clearOnboarding() {
    this.remove("onboarding");
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

    // Get existing data
    const existingData = localStorage.getItem(this.KEY);
    const data = existingData ? JSON.parse(existingData, this.reviver) : {};

    // Merge new data
    data[key] = value;

    // Save merged data
    localStorage.setItem(this.KEY, JSON.stringify(data, this.replacer));
  }

  private static get(key: string): any {
    if (typeof localStorage === "undefined") return null;
    const data = localStorage.getItem(this.KEY);

    if (!data) return null;

    const parsed = JSON.parse(data, this.reviver);

    return parsed[key] || null;
  }

  private static remove(key: string) {
    if (typeof localStorage === "undefined") return;
    const data = localStorage.getItem(this.KEY);

    if (!data) return;

    const parsed = JSON.parse(data, this.reviver);

    delete parsed[key];

    if (Object.keys(parsed).length === 0) {
      localStorage.removeItem(this.KEY);
    } else {
      localStorage.setItem(this.KEY, JSON.stringify(parsed, this.replacer));
    }
  }

  private static dispatchAuthChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authStateChange"));
    }
  }

  private static dispatchStorageChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  }
}
