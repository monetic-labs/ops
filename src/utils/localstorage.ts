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

  private static SAFE_USER_KEY = "@backpack/services";

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

  // Profile image methods
  static setProfileImage(base64Image: string) {
    const services = this.getItem(this.SAFE_USER_KEY);
    if (services) {
      const servicesObj = JSON.parse(services, this.reviver);
      servicesObj.profileImage = base64Image;
      this.setItem(this.SAFE_USER_KEY, JSON.stringify(servicesObj, this.replacer));
    }
  }

  static getProfileImage(): string | null {
    const services = this.getItem(this.SAFE_USER_KEY);
    if (services) {
      const servicesObj = JSON.parse(services, this.reviver);
      return servicesObj.profileImage || null;
    }
    return null;
  }

  static removeProfileImage() {
    const services = this.getItem(this.SAFE_USER_KEY);
    if (services) {
      const servicesObj = JSON.parse(services, this.reviver);
      delete servicesObj.profileImage;
      this.setItem(this.SAFE_USER_KEY, JSON.stringify(servicesObj, this.replacer));
    }
  }

  static setSafeUser(
    publicKeyCoordinates: WebauthnPublicKey,
    walletAddress: Address,
    settlementAddress: Address,
    passkeyId: string,
    isLogin: boolean
  ) {
    // Get existing data to preserve profile image if it exists
    const existingData = this.getItem(this.SAFE_USER_KEY);
    const existingProfileImage = existingData ? JSON.parse(existingData, this.reviver).profileImage : null;

    const data = {
      publicKeyCoordinates,
      walletAddress,
      settlementAddress,
      passkeyId,
      isLogin,
      profileImage: existingProfileImage, // Preserve profile image
    };

    this.setItem(this.SAFE_USER_KEY, JSON.stringify(data, this.replacer));
  }

  static getSafeUser() {
    const data = this.getItem(this.SAFE_USER_KEY);
    if (!data) return null;

    return JSON.parse(data, this.reviver);
  }

  static clearAuthState() {
    const data = this.getSafeUser();
    if (data) {
      // Preserve passkey data but clear login state
      this.setSafeUser(data.publicKeyCoordinates, data.walletAddress, data.settlementAddress, data.passkeyId, false);
    }
  }

  static hasExistingPasskey() {
    const data = this.getSafeUser();
    return Boolean(data?.publicKeyCoordinates && data?.walletAddress);
  }
}
