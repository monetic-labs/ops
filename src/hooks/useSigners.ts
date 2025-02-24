import { useState, useEffect, useCallback } from "react";
import { Address } from "viem";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";

import { Signer } from "@/types/account";
import pylon from "@/libs/pylon-sdk";
import { getFullName } from "@/utils/helpers";

interface SignerState {
  signers: Signer[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useSigners() {
  const [state, setState] = useState<SignerState>({
    signers: [],
    isLoading: true,
    error: null,
    lastFetched: null,
  });

  const fetchSigners = useCallback(
    async (force = false) => {
      // Return cached data if within cache duration
      if (!force && state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const users = await pylon.getUsers();

        const signers = users
          .filter((user): user is MerchantUserGetOutput & { walletAddress: Address } => Boolean(user.walletAddress))
          .map((user) => ({
            address: user.walletAddress,
            name: getFullName(user.firstName, user.lastName),
            image: "",
            role: user.role as PersonRole,
          }));

        setState({
          signers,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        });
      } catch (error) {
        console.error("Error fetching signers:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    },
    [state.lastFetched]
  );

  useEffect(() => {
    fetchSigners();
  }, [fetchSigners]);

  const getAvailableSigners = useCallback(
    (currentSigners: Address[] = []): Signer[] => {
      return state.signers.filter(
        (signer) => !currentSigners.some((current) => current.toLowerCase() === signer.address.toLowerCase())
      );
    },
    [state.signers]
  );

  const mapSignersToUsers = useCallback(
    (addresses: Address[]): Signer[] => {
      return addresses.map((address) => {
        const matchedSigner = state.signers.find((signer) => signer.address.toLowerCase() === address.toLowerCase());
        return (
          matchedSigner || {
            address,
            name: "Unknown User",
            image: "",
            role: undefined,
          }
        );
      });
    },
    [state.signers]
  );

  const addSigner = useCallback(async (accountAddress: Address, signer: Address): Promise<boolean> => {
    try {
      // TODO: Implement the actual signer addition logic using Safe SDK
      // This is a placeholder for the actual implementation
      console.log(`Adding signer ${signer} to account ${accountAddress}`);
      return true;
    } catch (error) {
      console.error("Error adding signer:", error);
      return false;
    }
  }, []);

  const removeSigner = useCallback(async (accountAddress: Address, signer: Address): Promise<boolean> => {
    try {
      // TODO: Implement the actual signer removal logic using Safe SDK
      // This is a placeholder for the actual implementation
      console.log(`Removing signer ${signer} from account ${accountAddress}`);
      return true;
    } catch (error) {
      console.error("Error removing signer:", error);
      return false;
    }
  }, []);

  const updateThreshold = useCallback(async (accountAddress: Address, newThreshold: number): Promise<boolean> => {
    try {
      // TODO: Implement the actual threshold update logic using Safe SDK
      // This is a placeholder for the actual implementation
      console.log(`Updating threshold to ${newThreshold} for account ${accountAddress}`);
      return true;
    } catch (error) {
      console.error("Error updating threshold:", error);
      return false;
    }
  }, []);

  return {
    signers: state.signers,
    isLoading: state.isLoading,
    error: state.error,
    getAvailableSigners,
    mapSignersToUsers,
    refetch: (force = true) => fetchSigners(force),
  };
}
