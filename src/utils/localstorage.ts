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

  // Profile image methods
  static setProfileImage(base64Image: string) {
    const services = this.getItem("@backpack/services");
    if (services) {
      const servicesObj = JSON.parse(services);
      servicesObj.profileImage = base64Image;
      this.setItem("@backpack/services", JSON.stringify(servicesObj));
    }
  }

  static getProfileImage(): string | null {
    const services = this.getItem("@backpack/services");
    if (services) {
      const servicesObj = JSON.parse(services);
      return servicesObj.profileImage || null;
    }
    return null;
  }

  static removeProfileImage() {
    const services = this.getItem("@backpack/services");
    if (services) {
      const servicesObj = JSON.parse(services);
      delete servicesObj.profileImage;
      this.setItem("@backpack/services", JSON.stringify(servicesObj));
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
    const existingData = this.getItem("@backpack/services");
    const existingProfileImage = existingData ? JSON.parse(existingData).profileImage : null;

    // Custom replacer function to handle BigInt serialization
    const bigIntReplacer = (key: string, value: any) => {
      if (typeof value === "bigint") {
        return value.toString(); // Convert BigInt to string
      }
      return value;
    };

    this.setItem(
      "@backpack/services",
      JSON.stringify(
        {
          publicKeyCoordinates,
          walletAddress,
          settlementAddress,
          passkeyId,
          isLogin,
          profileImage: existingProfileImage, // Preserve profile image
        },
        bigIntReplacer
      )
    );
  }

  static getSafeUser(): {
    publicKeyCoordinates: WebauthnPublicKey | null;
    walletAddress: Address | null;
    settlementAddress: Address | null;
    passkeyId: string | null;
    isLogin: boolean;
    profileImage?: string | null;
  } | null {
    const servicesStr = this.getItem("@backpack/services");

    if (!servicesStr)
      return {
        publicKeyCoordinates: null,
        walletAddress: null,
        settlementAddress: null,
        passkeyId: null,
        isLogin: false,
        profileImage: null,
      };

    // Custom reviver to convert string back to BigInt
    const bigIntReviver = (key: string, value: any) => {
      // Check if the value looks like a BigInt string
      if (typeof value === "string" && /^-?\d+n?$/.test(value)) {
        return BigInt(value);
      }
      return value;
    };

    const { publicKeyCoordinates, walletAddress, settlementAddress, passkeyId, isLogin, profileImage } = JSON.parse(
      servicesStr,
      bigIntReviver
    );

    return { publicKeyCoordinates, walletAddress, settlementAddress, passkeyId, isLogin, profileImage };
  }
}
