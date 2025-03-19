# Passkey Management

## Overview

The Passkey Management system enables secure, passwordless authentication and transaction signing using the WebAuthn standard. It integrates with Smart Contract Wallets (Safe accounts) to manage cryptographic keys for authentication, recovery, and blockchain interactions. Users can register multiple passkeys across different devices for enhanced security and convenience.

## Key Concepts

### Passkey States

Each passkey in the system exists in one of the following states:

```typescript
export enum PasskeyStatus {
  ACTIVE_ONCHAIN = "ACTIVE_ONCHAIN", // Registered on-chain and off-chain
  PENDING_ONCHAIN = "PENDING_ONCHAIN", // Registered off-chain but not on-chain yet
  UNKNOWN = "UNKNOWN", // Status couldn't be determined
}
```

- **ACTIVE_ONCHAIN**: The passkey is fully registered both in the backend database and as an owner in the blockchain Safe account.
- **PENDING_ONCHAIN**: The passkey is registered in the backend but not yet activated on the blockchain.
- **UNKNOWN**: The passkey's status cannot be determined, often due to missing or invalid public key data.

### Passkey Data Structure

Passkeys are represented with the following structure:

```typescript
export interface PasskeyWithStatus {
  credentialId: string; // Unique identifier for the passkey
  publicKey: string; // The public key in hex format
  displayName: string; // User-friendly name of the passkey
  status: PasskeyStatus; // Current status of the passkey
  ownerAddress?: Address; // Derived owner address for on-chain verification
  lastUsedAt: string; // Timestamp of last usage
}
```

## Architecture

### Component Interaction

The passkey management system spans multiple layers of the application:

1. **Browser Layer**: Uses the WebAuthn API to interact with hardware authenticators (biometric sensors, security keys)
2. **Application Layer**: Manages passkey context, credentials, and UI components
3. **Blockchain Layer**: Handles on-chain registration of passkeys as owners in the Safe account

### Key Components

1. **WebAuthnHelper**: Utility class for interacting with the WebAuthn browser API
2. **UserContext**: React context for managing credentials during a user session
3. **PasskeySelectionContext**: React context for credential selection with persistence
4. **Passkey Management API**: Backend services for storing and retrieving passkey data
5. **Safe Integration**: Blockchain interaction for registering passkeys as owners in the Safe
6. **LocalStorage**: Client-side persistence of selected credential identifiers

## Core Workflows

### User Authentication

1. User enters their email address
2. System checks if they have registered passkeys:
   - If yes, initiates WebAuthn authentication
   - If no, sends email magic link
3. On successful authentication, the credential is added to the UserContext
4. The credential ID is stored in local storage for session persistence
5. User is redirected to the dashboard

```typescript
// From auth/page.tsx
const handlePasskeyAuth = async (credentials: PasskeyCredential[]) => {
  try {
    const webauthn = await WebAuthnHelper.login(credentials.map((cred) => cred.credentialId));
    const { publicKey, credentialId } = webauthn.getCredentials();

    // Add credential to context for the session
    addCredential({ publicKey, credentialId });

    // Store credential ID in localStorage for persistence
    localStorage.saveSelectedCredentialId(credentialId);

    router.push("/");
  } catch (error) {
    // Fallback to email authentication
  }
};
```

### Creating a New Account with Passkey

1. User provides required information during onboarding
2. System creates a passkey using WebAuthn
3. A new Safe account is deployed with the passkey as an owner
4. Social recovery options are configured

```typescript
// From onboard/page.tsx
const {
  publicKeyCoordinates: publicKey,
  credentialId,
  passkeyId,
} = await WebAuthnHelper.createPasskey(formData.users[0].email);

// Deploy individual Safe account
await deployIndividualSafe({
  credentials: { publicKey, credentialId },
  recoveryMethods: {
    email: formData.users[0].email,
    phone: formData.users[0].phoneNumber.number,
  },
  // ... other configuration
});

// Store credential in context
addCredential({ publicKey, credentialId });
```

### Adding Additional Passkeys

1. User requests to add a new passkey in the user-edit modal
2. User authenticates with an existing on-chain passkey
3. System creates a new passkey
4. The new passkey is registered on-chain as an additional owner

```typescript
// From user-edit.tsx
const result = await addPasskeyToSafe({
  safeAddress: user.walletAddress as Address,
  userEmail: user.email,
  credential: {
    publicKey: validCredential.publicKey,
    credentialId: validCredential.credentialId,
  },
  // ... callbacks for different stages
});

// Update UI with new passkey information
const newPasskey = {
  credentialId: result.credentialId,
  publicKey: PublicKey.toHex({ ...result.publicKeyCoordinates, prefix: 4 }),
  displayName: "",
  // ... other properties
};
```

### Synchronizing Passkey Status

The system regularly synchronizes the on-chain and off-chain status of passkeys:

1. Retrieve all registered passkeys from the database
2. Get on-chain owners from the Safe contract
3. For each passkey, compute its on-chain owner address
4. Compare with on-chain owners to determine status
5. Return updated passkey status information for UI rendering

```typescript
// From passkey.ts
export async function syncPasskeysWithSafe(
  walletAddress: Address | undefined,
  registeredPasskeys: Array<{
    credentialId: string;
    publicKey?: string;
    // ... other properties
  }> = []
): Promise<PasskeyWithStatus[]> {
  // Get on-chain owners
  const owners = (await publicClient.readContract({
    address: walletAddress,
    abi: SAFE_ABI,
    functionName: "getOwners",
  })) as Address[];

  // Fill in missing public keys from backend if possible
  // Map each passkey to its status
  // Return array of passkeys with accurate status
}
```

### Credential Selection for Transactions

The system uses a dedicated context to manage credential selection during transactions:

1. Component calls `selectCredential()` when a signature is needed
2. If a credential ID is stored in local storage, it's checked first
3. If no stored credential is available or valid, the selection modal appears
4. User selects a credential to use for signing
5. The selected credential is stored in local storage for future use
6. The selection promise resolves with the chosen credential

```typescript
// From a component needing to sign a transaction
try {
  // This will check for a stored credential first before showing the modal
  const selectedCredential = await selectCredential();

  // Proceed with transaction using the credential
  await executeNestedTransaction({
    fromSafeAddress: user.walletAddress as Address,
    throughSafeAddress: selectedAccount.address,
    transactions: [transferTemplate],
    credentials: selectedCredential,
    // ... callbacks
  });
} catch (error) {
  // Handle selection cancellation or failure
  console.error("Credential selection failed:", error);
  toast.error("Failed to select a passkey. Please try again.");
}
```

## User Interface Components

### User Edit Modal

The primary interface for passkey management is the user-edit modal, which allows users to:

- View existing passkeys and their status
- Add new passkeys
- Activate pending passkeys
- Rename passkeys for better identification

The UI displays each passkey with:

- A device name (customizable)
- A status indicator (Active, Pending, Unknown)
- Actions based on current status

### Passkey Status Display

Each passkey's status is visually indicated with a color-coded chip:

- **Active**: Green chip with checkmark icon
- **Pending**: Yellow chip with clock icon
- **Unknown**: Gray chip with alert icon

### Passkey Selection Modal

A dedicated modal for credential selection during transactions:

- Shows available passkeys for the current user
- Indicates the most recently used passkey
- Allows users to cancel the selection process
- Provides clear instructions based on the action being performed

## Session Management

### Credential Storage

Credentials are stored in the UserContext during an active session:

1. **State Management**: The React context maintains an array of available credentials
2. **In-Memory Only**: Credentials with private key information are never persisted to local storage
3. **Session Lifecycle**: Credentials are available throughout a user's session for transaction signing

### Credential Addition

The `addCredential` function adds or updates credentials in the context:

```typescript
const handleAddCredential = (newCredential: WebAuthnCredentials) => {
  setCredentials((prev) => {
    // If array doesn't exist yet, create it with the new credential
    if (!prev) return [newCredential];

    // Check if credential already exists by credentialId
    const exists = prev.some((cred) => cred.credentialId === newCredential.credentialId);
    if (exists) {
      // Replace the existing credential
      return prev.map((cred) => (cred.credentialId === newCredential.credentialId ? newCredential : cred));
    }

    // Add the new credential to the array
    return [...prev, newCredential];
  });
};
```

### Persistent Credential Selection

The system uses local storage to remember which credential a user prefers to use:

1. **Saving Selection**: When a credential is selected for a transaction, its ID is saved
2. **Retrieving Selection**: Before displaying the modal, the system checks for a stored credential
3. **Clearing Selection**: During logout, the stored credential ID is cleared

```typescript
// LocalStorage utility for credential persistence
export class LocalStorage {
  // Save the selected credential ID
  static saveSelectedCredentialId(credentialId: string): void {
    try {
      localStorage.setItem("@backpack/state:passkey", credentialId);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // Get the stored credential ID if available
  static getSelectedCredentialId(): string | null {
    try {
      return localStorage.getItem("@backpack/state:passkey");
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  // Clear the stored credential ID (used during logout)
  static clearSelectedCredentialId(): void {
    try {
      localStorage.removeItem("@backpack/state:passkey");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
}
```

## Passkey Selection Context

The PasskeySelectionContext provides a streamlined API for credential selection:

### Architecture

1. **Provider Pattern**: Context provider wraps the application to manage state
2. **Modal Component**: UI component for credential selection
3. **Public API**: External interfaces for components to request credentials
4. **Internal API**: State management hidden from consumers

### Core Components

```typescript
// Public API exposed to components
interface PasskeySelectionContextType {
  selectCredential: (config?: SelectCredentialConfig) => Promise<WebAuthnCredentials>;
  hasMultipleCredentials: boolean;
  hasExistingCredential: boolean;
}

// Internal state and modal management
interface PasskeySelectionModalContextType {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  resolve: (credential: WebAuthnCredentials) => void;
  reject: (error: Error) => void;
  selectedCredential: WebAuthnCredentials | null;
  setSelectedCredential: (credential: WebAuthnCredentials | null) => void;
}
```

### How It Works

1. Component calls `selectCredential()` which returns a Promise
2. If a stored credential is found in localStorage, it's verified and returned without showing the modal
3. Otherwise, the modal is opened to let the user choose a credential
4. When a credential is selected, the Promise resolves
5. If the modal is closed without selection, the Promise rejects
6. The selected credential is stored in localStorage for future use

```typescript
const selectCredential = async (config?: SelectCredentialConfig): Promise<WebAuthnCredentials> => {
  // Check if we have a valid credential ID in local storage
  const storedCredentialId = LocalStorage.getSelectedCredentialId();

  if (storedCredentialId) {
    // Find the credential in available credentials
    const storedCredential = credentials?.find((cred) => cred.credentialId === storedCredentialId);

    if (storedCredential) {
      // Return the stored credential without showing modal
      return storedCredential;
    }
  }

  return new Promise((resolve, reject) => {
    setResolver({ resolve, reject });
    onOpenModal();
  });
};
```

## Public Key Handling

### Format Conversion

The system handles various formats of public keys:

1. **WebAuthn Format**: Object with x and y coordinates as bigints
2. **Hex String Format**: Hex representation with 0x04 prefix
3. **JSON String Format**: Stringified JSON object with x and y properties

Conversion between formats uses the PublicKey utility from the 'ox' library:

```typescript
// Convert WebAuthn coordinates to hex
const publicKeyHex = PublicKey.toHex({ ...credentials.publicKey, prefix: 4 });

// Convert hex back to coordinates
const { x, y } = PublicKey.fromHex(publicKeyHex as Hex);
```

### Public Key Recovery

For passkeys with missing public keys, the system implements recovery mechanisms:

1. Attempt to find the complete passkey data from the Pylon API
2. Enrich the local passkey objects with the retrieved public keys
3. If public keys are still missing, mark the passkey as UNKNOWN status

## Error Handling and Recovery

### Error Scenarios

The system handles various error scenarios related to passkey operations:

1. **Selection Cancellation**: User closes the selection modal without choosing a credential
2. **Authentication Failures**: WebAuthn operations failing due to browser or hardware issues
3. **Missing Credentials**: No valid credentials available for selection
4. **Transaction Signing Errors**: Failures during the blockchain transaction process

### Recovery Strategies

For each error type, the system implements appropriate recovery strategies:

1. **Selection Cancellation**:

   - Reject the selection Promise with a descriptive error
   - Allow the calling component to handle the cancellation gracefully
   - Provide user feedback about the cancelled operation

2. **Authentication Failures**:

   - Fall back to email-based authentication
   - Provide clear error messages to guide users
   - Offer alternative authentication methods

3. **Missing Credentials**:

   - Prompt users to register a new passkey
   - Provide links to account recovery options
   - Guide users through the recovery process

4. **Transaction Signing Errors**:
   - Display detailed error information
   - Retry mechanisms for transient failures
   - Alternative signing methods when available

### Example Error Handling

```typescript
// In a component using credential selection
try {
  const selectedCredential = await selectCredential();

  // Proceed with the transaction
  await executeTransaction(selectedCredential);
} catch (error) {
  if (error.message === "Credential selection cancelled") {
    // Handle user cancellation
    toast.info("Transaction cancelled");
  } else if (error.message.includes("No credentials available")) {
    // Handle missing credentials
    toast.error("No valid passkeys found. Please register a new passkey.");
    router.push("/account/settings");
  } else {
    // Handle other errors
    console.error("Transaction error:", error);
    toast.error("Transaction failed. Please try again.");
  }
}
```

## Security Considerations

### Multiple Device Support

Supporting multiple passkeys enhances security by:

- Providing backup authentication methods
- Allowing for device-specific passkeys
- Reducing risk of account lockout due to lost/damaged devices

### Activation Process

The two-phase registration process (off-chain then on-chain) enables:

- Immediate account creation and login
- Delayed blockchain transactions for activation
- Validation using existing on-chain passkeys

### Passkey Removal

Passkey removal implementation considerations:

- Requires at least one active on-chain passkey to remain
- Removal from blockchain requires a transaction signed by another valid passkey
- Passkey remains in database with inactive status until properly removed

### Persistent Credential Selection Security

The persistent credential selection mechanism ensures security by:

- Storing only the credential ID, never the private key or signature data
- Clearing the selection during logout
- Using namespaced storage to prevent collisions
- Including error handling for storage operations

## Best Practices

1. **Always show clear status indications**: Users should understand the state of their passkeys
2. **Provide guidance for pending passkeys**: Explain the activation process
3. **Encourage multiple passkeys**: Educate users on the benefits of registering backup passkeys
4. **Handle missing public keys gracefully**: Design for resilience when public key data is incomplete
5. **Optimize credential management**: Only store what's needed in client-side context
6. **Persist user preferences**: Remember which passkey a user prefers to use
7. **Clear state on logout**: Ensure credential IDs are cleared during logout
8. **Provide clear error messages**: Help users understand and recover from errors
9. **Implement graceful fallbacks**: Always have alternative paths when passkey operations fail

## Technical Reference

### Key Functions

| Function                                 | Description                                        |
| ---------------------------------------- | -------------------------------------------------- |
| `createPasskeyCredentials`               | Creates a new passkey using WebAuthn               |
| `syncPasskeysWithSafe`                   | Synchronizes passkey status with blockchain        |
| `addPasskeyToSafe`                       | Adds a new passkey to an existing Safe account     |
| `UserContext.addCredential`              | Adds/updates credential in session context         |
| `WebAuthnHelper.login`                   | Authenticates user with existing passkeys          |
| `WebAuthnHelper.createPasskey`           | Creates a new WebAuthn credential                  |
| `selectCredential`                       | Prompts for credential selection or uses saved one |
| `LocalStorage.saveSelectedCredentialId`  | Persists the selected credential ID                |
| `LocalStorage.clearSelectedCredentialId` | Removes the stored credential ID                   |

### Related Components

- `UserEditModal`: UI for managing passkeys
- `UserContext`: Session credential management
- `PasskeySelectionContext`: Credential selection management
- `PasskeySelectionModal`: UI for selecting credentials
- `WebAuthnHelper`: Browser API interaction
- `Safe Account`: Blockchain wallet integration
- `LocalStorage`: Client-side persistence utilities
