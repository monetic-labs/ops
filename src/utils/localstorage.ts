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

  static setSafeUser(
    publicKeyCoordinates: WebauthnPublicKey,
    walletAddress: Address,
    settlementAddress: Address,
    passkeyId: string,
    isLogin: boolean
  ) {
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
  } | null {
    const servicesStr = this.getItem("@backpack/services");

    if (!servicesStr)
      return {
        publicKeyCoordinates: null,
        walletAddress: null,
        settlementAddress: null,
        passkeyId: null,
        isLogin: false,
      };

    // Custom reviver to convert string back to BigInt
    const bigIntReviver = (key: string, value: any) => {
      // Check if the value looks like a BigInt string
      if (typeof value === "string" && /^-?\d+n?$/.test(value)) {
        return BigInt(value);
      }

      return value;
    };

    const { publicKeyCoordinates, walletAddress, settlementAddress, passkeyId, isLogin } = JSON.parse(
      servicesStr,
      bigIntReviver
    );

    return { publicKeyCoordinates, walletAddress, settlementAddress, passkeyId, isLogin };
  }
}
