"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Address, getAddress } from "viem";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";

import { Signer } from "@/types/account";
import { getFullName } from "@/utils/helpers";
import { useUsers } from "@/contexts/UsersContext";

interface SignersContextState {
  signers: Signer[];
  accountSigners: Signer[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null;
  getAvailableSigners: (currentSigners?: Address[]) => Signer[];
  mapSignersToUsers: (addresses: Address[], accountName?: string) => Signer[];
  addSigner: (accountAddress: Address, signer: Address) => Promise<boolean>;
  removeSigner: (accountAddress: Address, signer: Address) => Promise<boolean>;
  updateThreshold: (accountAddress: Address, newThreshold: number) => Promise<boolean>;
  updateAccountSigners: (signers: Signer[]) => void;
  refetch: (force?: boolean) => Promise<void>;
}

const CACHE_DURATION = 60 * 1000; // 60 seconds in milliseconds

const SignersContext = createContext<SignersContextState | null>(null);

export function SignersProvider({ children }: { children: ReactNode }) {
  const { users, isLoading: isLoadingUsers } = useUsers();
  const [state, setState] = useState({
    signers: [] as Signer[],
    accountSigners: [] as Signer[],
    isLoading: true,
    error: null as Error | null,
    lastFetched: null as number | null,
  });

  const transformUserToSigner = useCallback((user: MerchantUserGetOutput): Signer | null => {
    if (user.walletAddress) {
      return {
        address: user.walletAddress as Address,
        name: getFullName(user.firstName, user.lastName),
        image: "",
        role: user.role as PersonRole,
        isAccount: false,
      };
    }

    if (user.registeredPasskeys && user.registeredPasskeys.length > 0) {
      const publicKey = user.registeredPasskeys[0].publicKey;

      try {
        const derivedAddress = getAddress(publicKey);

        return {
          address: derivedAddress,
          name: getFullName(user.firstName, user.lastName),
          image: "",
          role: user.role as PersonRole,
          isAccount: false,
        };
      } catch (error) {
        console.error("Error deriving address from public key:", error);

        return null;
      }
    }

    return null;
  }, []);

  const processSigners = useCallback(
    async (force = false) => {
      if (!force && state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const userSigners = users.map(transformUserToSigner).filter((signer): signer is Signer => signer !== null);

        setState((prev) => ({
          ...prev,
          signers: userSigners,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        }));
      } catch (error) {
        console.error("Error processing signers:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    },
    [users, transformUserToSigner]
  );

  useEffect(() => {
    if (!isLoadingUsers) {
      processSigners();
    }
  }, [processSigners, isLoadingUsers]);

  const getAvailableSigners = useCallback(
    (currentSigners: Address[] = []): Signer[] => {
      const allSigners = [...state.signers, ...state.accountSigners];

      return allSigners.filter(
        (signer) => !currentSigners.some((current) => current.toLowerCase() === signer.address.toLowerCase())
      );
    },
    [state.signers, state.accountSigners]
  );

  const mapSignersToUsers = useCallback(
    (addresses: Address[], accountName?: string): Signer[] => {
      return addresses.map((address) => {
        // First check if it's a user signer
        const userSigner = state.signers.find((signer) => signer.address.toLowerCase() === address.toLowerCase());

        if (userSigner) {
          return userSigner;
        }

        // Then check if it's an account signer
        const accountSigner = state.accountSigners.find(
          (signer) => signer.address.toLowerCase() === address.toLowerCase()
        );

        if (accountSigner) {
          return accountSigner;
        }

        // If no match found and we have an account name, create an account signer
        if (accountName) {
          return {
            address,
            name: accountName,
            image: "",
            role: undefined,
            isAccount: true,
          };
        }

        // Default case - unknown signer
        return {
          address,
          name: "Unknown Signer",
          image: "",
          role: undefined,
          isAccount: false,
        };
      });
    },
    [state.signers, state.accountSigners]
  );

  const addSigner = useCallback(async (accountAddress: Address, signer: Address): Promise<boolean> => {
    try {
      console.log(`Adding signer ${signer} to account ${accountAddress}`);

      return true;
    } catch (error) {
      console.error("Error adding signer:", error);

      return false;
    }
  }, []);

  const removeSigner = useCallback(async (accountAddress: Address, signer: Address): Promise<boolean> => {
    try {
      console.log(`Removing signer ${signer} from account ${accountAddress}`);

      return true;
    } catch (error) {
      console.error("Error removing signer:", error);

      return false;
    }
  }, []);

  const updateThreshold = useCallback(async (accountAddress: Address, newThreshold: number): Promise<boolean> => {
    try {
      console.log(`Updating threshold to ${newThreshold} for account ${accountAddress}`);

      return true;
    } catch (error) {
      console.error("Error updating threshold:", error);

      return false;
    }
  }, []);

  const updateAccountSigners = useCallback((signers: Signer[]) => {
    setState((prev) => ({
      ...prev,
      accountSigners: signers,
    }));
  }, []);

  const value = {
    ...state,
    getAvailableSigners,
    mapSignersToUsers,
    addSigner,
    removeSigner,
    updateThreshold,
    updateAccountSigners,
    refetch: (force = true) => processSigners(force),
  };

  return <SignersContext.Provider value={value}>{children}</SignersContext.Provider>;
}

export function useSigners() {
  const context = useContext(SignersContext);

  if (!context) {
    throw new Error("useSigners must be used within a SignersProvider");
  }

  return context;
}
