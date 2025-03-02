import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MerchantUserGetOutput, PersonRole, MerchantUserCreateInput } from "@backpack-fux/pylon-sdk";

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
    isLoading: true,
    error: null as Error | null,
    lastFetched: null as number | null,
  });

  const fetchUsers = useCallback(
    async (force = false) => {
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
    [state.lastFetched, state.users]
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
      await pylon.updateUser(updatedUser.id, {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        email: updatedUser.email,
        username: updatedUser.username,
        walletAddress: updatedUser.walletAddress,
        phone: updatedUser.phone,
      });

      // Update the local state instead of refetching
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
        if (userToRemove.pendingInvite && !userToRemove.pendingInvite.isUsed) {
          // For pending invites, use cancelInvite with the invite ID
          const success = await pylon.cancelInvite(userToRemove.pendingInvite.id);
          if (!success) throw new Error("Failed to cancel invite");
        } else {
          // For active users, use deleteUser with the user ID
          const success = await pylon.deleteUser(userId);
          if (!success) throw new Error("Failed to remove user");
        }

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

  // Only fetch users when user context is available
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

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
