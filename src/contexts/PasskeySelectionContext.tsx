"use client";

import React, { useState, useCallback, useMemo, createContext, useContext, ReactNode, useEffect } from "react";
import { useDisclosure } from "@heroui/modal";

import { WebAuthnCredentials } from "@/types/webauthn";
import { useUser } from "@/contexts/UserContext";
import { LocalStorage } from "@/utils/localstorage";

// Define the interface for the context
interface PasskeySelectionContextValue {
  selectCredential: () => Promise<WebAuthnCredentials>;
  hasMultipleCredentials: boolean;
  hasCredentials: boolean;
  // Internal state (for modal component)
  _state: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSelect: (credential: WebAuthnCredentials) => void;
    onCancel: () => void;
  };
}

// Create the context with a default value of null
const PasskeySelectionContext = createContext<PasskeySelectionContextValue | null>(null);

/**
 * Provider component for the passkey selection context
 */
export function PasskeySelectionProvider({ children }: { children: ReactNode }) {
  // Get user credentials
  const { getCredentials } = useUser();
  const credentials = useMemo(() => getCredentials() || [], [getCredentials]);

  // Modal state
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // State for promise resolution
  const [resolver, setResolver] = useState<{
    resolve: (value: WebAuthnCredentials) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  // Handle credential selection
  const handleSelect = useCallback(
    (credential: WebAuthnCredentials) => {
      if (resolver) {
        // Save the selected credential ID and rpId to localStorage
        LocalStorage.saveSelectedPasskeyInfo({
          credentialId: credential.credentialId,
          rpId: credential.rpId,
        });

        resolver.resolve(credential);
        setResolver(null);
      }
    },
    [resolver]
  );

  // Handle selection cancellation
  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver.reject(new Error("Passkey selection canceled"));
      setResolver(null);
    }
  }, [resolver]);

  // Main function that components will use
  const selectCredential = useCallback((): Promise<WebAuthnCredentials> => {
    return new Promise((resolve, reject) => {
      // If user has no credentials, reject immediately
      if (!credentials || credentials.length === 0) {
        return reject(new Error("No passkeys available for signing"));
      }

      // If user has only one credential, just use that
      if (credentials.length === 1) {
        try {
          // Save the selected credential ID and rpId to localStorage
          LocalStorage.saveSelectedPasskeyInfo({
            credentialId: credentials[0].credentialId,
            rpId: credentials[0].rpId,
          });
        } catch (error) {
          console.error("Failed to save passkey info:", error);
          // Continue even if local storage fails
        }
        return resolve(credentials[0]);
      }

      try {
        // Check if we have a stored passkey info
        const savedPasskeyInfo = LocalStorage.getSelectedPasskeyInfo();
        if (savedPasskeyInfo) {
          // Find the credential with the saved ID and rpId
          const savedCredential = credentials.find(
            (cred) => cred.credentialId === savedPasskeyInfo.credentialId && cred.rpId === savedPasskeyInfo.rpId
          );
          if (savedCredential) {
            // If found, use it without showing the modal
            return resolve(savedCredential);
          }
        }
      } catch (error) {
        console.error("Error checking saved passkey info:", error);
        // Continue with modal selection if there's an error
      }

      // If no saved credential or it wasn't found, show the modal
      // Store the resolver functions
      setResolver({ resolve, reject });

      // Open the modal
      onOpen();
    });
  }, [credentials, onOpen, setResolver]);

  // Create the context value
  const value = useMemo(
    () => ({
      selectCredential,
      hasMultipleCredentials: credentials.length > 1,
      hasCredentials: credentials.length > 0,
      // Internal state that only the modal component should use
      _state: {
        isOpen,
        onOpenChange,
        onSelect: handleSelect,
        onCancel: handleCancel,
      },
    }),
    [selectCredential, credentials.length, isOpen, onOpenChange, handleSelect, handleCancel]
  );

  return <PasskeySelectionContext.Provider value={value}>{children}</PasskeySelectionContext.Provider>;
}

/**
 * Hook for components to select a passkey
 */
export function usePasskeySelection() {
  const context = useContext(PasskeySelectionContext);

  if (!context) {
    throw new Error("usePasskeySelection must be used within a PasskeySelectionProvider");
  }

  // Return only the public API
  return {
    selectCredential: context.selectCredential,
    hasMultipleCredentials: context.hasMultipleCredentials,
    hasCredentials: context.hasCredentials,
  };
}

/**
 * Hook for the modal component to access internal state
 * This is not meant to be used by regular components
 */
export function usePasskeySelectionModal() {
  const context = useContext(PasskeySelectionContext);

  if (!context) {
    throw new Error("usePasskeySelectionModal must be used within a PasskeySelectionProvider");
  }

  return context._state;
}
