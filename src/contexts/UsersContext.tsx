import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MerchantUserGetOutput, PersonRole, MerchantUserCreateInput } from "@monetic-labs/sdk";

import pylon from "@/libs/pylon-sdk";

import { useUser } from "./UserContext";

interface UsersContextState {
  users: MerchantUserGetOutput[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null;
  isOwner: boolean;
  getAvailableRoles: () => PersonRole[];
  fetchUsers: (force?: boolean) => Promise<MerchantUserGetOutput[]>;
  createUser: (data: MerchantUserCreateInput) => Promise<MerchantUserGetOutput>;
  updateUser: (updatedUser: MerchantUserGetOutput) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
}

const UsersContext = createContext<UsersContextState | null>(null);

const CACHE_DURATION = 60 * 1000; // 60 seconds in milliseconds

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [state, setState] = useState({
    users: [] as MerchantUserGetOutput[],
    isLoading: false,
    error: null as Error | null,
    lastFetched: null as number | null,
  });

  const fetchUsers = useCallback(
    async (force = false) => {
      // Don't fetch if no user is available
      if (!user) return state.users;

      // Return cached data if within cache duration
      if (!force && state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
        return state.users;
      }

      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const fetchedUsers = await pylon.getUsers();

        setState({
          users: fetchedUsers,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        });

        return fetchedUsers;
      } catch (err) {
        console.error("Error fetching users:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err as Error,
        }));

        return [];
      }
    },
    [user, state.lastFetched, state.users]
  );

  const createUser = useCallback(async (data: MerchantUserCreateInput) => {
    try {
      const newUser = await pylon.createUser(data);

      // Update local state with the new user
      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        lastFetched: Date.now(),
      }));

      return newUser;
    } catch (err) {
      console.error("Error creating user:", err);
      setState((prev) => ({ ...prev, error: err as Error }));
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: MerchantUserGetOutput) => {
    try {
      // Create update payload, removing walletAddress if it's null/undefined/empty
      const updatePayload: Record<string, any> = {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        email: updatedUser.email,
        username: updatedUser.username,
        phone: updatedUser.phone,
      };

      // Only include walletAddress if it's a valid value
      if (updatedUser.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(updatedUser.walletAddress)) {
        updatePayload.walletAddress = updatedUser.walletAddress;
      }

      await pylon.updateUser(updatedUser.id, updatePayload);

      // Optimistically update the local state
      setState((prev) => ({
        ...prev,
        users: prev.users.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      }));

      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      setState((prev) => ({ ...prev, error: err as Error }));

      return false;
    }
  }, []);

  const removeUser = useCallback(
    async (userId: string) => {
      const userToRemove = state.users.find((u) => u.id === userId);

      if (!userToRemove) return false;

      try {
        const success = await pylon.deleteUser(userId);

        if (!success) throw new Error("Failed to remove user");

        // Update the local state
        setState((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== userId),
        }));

        return true;
      } catch (err) {
        console.error("Error removing user:", err);
        setState((prev) => ({ ...prev, error: err as Error }));

        return false;
      }
    },
    [state.users]
  );

  // Only fetch users when user context is available and we haven't fetched before
  useEffect(() => {
    if (user && !state.lastFetched) {
      fetchUsers();
    }
  }, [user, state.lastFetched, fetchUsers]);

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setState({
        users: [],
        isLoading: false,
        error: null,
        lastFetched: null,
      });
    }
  }, [user]);

  const isOwner = user?.role === PersonRole.OWNER;

  const getAvailableRoles = useCallback(() => {
    return Object.values(PersonRole).filter(() => {
      if (isOwner) return true;

      return false;
    });
  }, [isOwner]);

  const value = {
    ...state,
    isOwner,
    getAvailableRoles,
    fetchUsers: useCallback((force = true) => fetchUsers(force), [fetchUsers]),
    createUser,
    updateUser,
    removeUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);

  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }

  return context;
}
