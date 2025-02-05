import { WebauthnPublicKey } from "abstractionkit";
import { Address } from "viem";

export class LocalStorage {
  private static getItem(key: string): string | null {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  }

  private static removeItem(key: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  }

  private static BACKPACK_STATE_KEY = "@backpack/service:state";

  // Custom replacer for JSON.stringify to handle BigInt
  private static replacer(key: string, value: any) {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  }

  // Custom reviver for JSON.parse to handle BigInt strings
  private static reviver(key: string, value: any) {
    // Check if the value matches a BigInt string pattern
    if (typeof value === "string" && /^-?\d+n?$/.test(value)) {
      return BigInt(value.replace("n", ""));
    }
    return value;
  }

  static setSafeUser(
    publicKey: any,
    walletAddress: string,
    settlementAddress: string,
    passkeyId: string,
    isLogin: boolean
  ) {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    const parsedState = currentState ? JSON.parse(currentState, this.reviver) : {};

    const updatedState = {
      ...parsedState,
      user: {
        publicKey,
        walletAddress,
        settlementAddress,
        passkeyId,
        isLogin,
        timestamp: Date.now(),
      },
    };
    this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(updatedState, this.replacer));

    // Dispatch custom event for auth state changes
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authStateChange"));
    }
  }

  static getSafeUser() {
    const state = this.getItem(this.BACKPACK_STATE_KEY);
    if (!state) return null;
    const parsedState = JSON.parse(state, this.reviver);
    return parsedState.user || null;
  }

  static setOnboardingState(state: {
    passkeyId: string;
    walletAddress: string;
    settlementAddress: string;
    publicKeyCoordinates: { x: string; y: string };
  }) {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    const parsedState = currentState ? JSON.parse(currentState, this.reviver) : {};

    const updatedState = {
      ...parsedState,
      onboarding: {
        ...state,
        timestamp: Date.now(),
        isOnboarding: true,
      },
    };
    this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(updatedState, this.replacer));
  }

  static getOnboardingState() {
    const state = this.getItem(this.BACKPACK_STATE_KEY);
    if (!state) return null;
    const parsedState = JSON.parse(state, this.reviver);
    return parsedState.onboarding || null;
  }

  static clearOnboardingState() {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    if (!currentState) return;

    const parsedState = JSON.parse(currentState, this.reviver);
    delete parsedState.onboarding;
    this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(parsedState, this.replacer));
  }

  static setPasskeyRegistered(passkeyId: string) {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    const parsedState = currentState ? JSON.parse(currentState, this.reviver) : {};

    const updatedState = {
      ...parsedState,
      passkey: {
        passkeyId,
        isRegistered: true,
        timestamp: Date.now(),
      },
    };
    this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(updatedState, this.replacer));
  }

  static hasPasskeyRegistered() {
    const state = this.getItem(this.BACKPACK_STATE_KEY);
    if (!state) return false;
    const parsedState = JSON.parse(state, this.reviver);
    return parsedState.passkey?.isRegistered || false;
  }

  static getPasskeyId() {
    const state = this.getItem(this.BACKPACK_STATE_KEY);
    if (!state) return null;
    const parsedState = JSON.parse(state, this.reviver);
    return parsedState.passkey?.passkeyId || null;
  }

  static clearAll() {
    this.removeItem(this.BACKPACK_STATE_KEY);
  }

  static clearAuthState() {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    if (!currentState) return;

    const parsedState = JSON.parse(currentState, this.reviver);
    if (parsedState.user) {
      // Preserve passkey data but clear login state
      parsedState.user.isLogin = false;
      this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(parsedState, this.replacer));
    }
  }

  // Profile image methods
  static setProfileImage(base64Image: string) {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    const parsedState = currentState ? JSON.parse(currentState, this.reviver) : {};

    const updatedState = {
      ...parsedState,
      user: {
        ...parsedState.user,
        profileImage: base64Image,
      },
    };
    this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(updatedState, this.replacer));
  }

  static getProfileImage(): string | null {
    const state = this.getItem(this.BACKPACK_STATE_KEY);
    if (!state) return null;
    const parsedState = JSON.parse(state, this.reviver);
    return parsedState.user?.profileImage || null;
  }

  static removeProfileImage() {
    const currentState = this.getItem(this.BACKPACK_STATE_KEY);
    if (!currentState) return;

    const parsedState = JSON.parse(currentState, this.reviver);
    if (parsedState.user) {
      delete parsedState.user.profileImage;
      this.setItem(this.BACKPACK_STATE_KEY, JSON.stringify(parsedState, this.replacer));
    }
  }
}
