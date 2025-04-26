# Safe Module Architecture

## Overview

The Safe module provides a comprehensive set of utilities for interacting with Smart Contract Wallets (Safe accounts) on the blockchain. It handles various operations such as account creation, transaction execution, social recovery setup, passkey management, and specialized features like Rain Card transfers.

The module is organized in a modular, layered architecture to ensure separation of concerns, maintainability, and reusability.

## Directory Structure

```
src/utils/safe/
├── core/                 # Core building blocks and fundamental operations
│   ├── account.ts        # Account creation and management
│   ├── data.ts           # Safe account data retrieval
│   ├── operations.ts     # Basic operations (deploy, send, etc.)
│   └── transactions.ts   # Transaction preparation and execution
├── flows/                # Reusable transaction flow patterns
│   ├── direct.ts         # Direct transaction flow
│   └── nested.ts         # Nested transaction flow (transaction via intermediary)
├── features/             # Feature-specific implementations
│   ├── deploy.ts         # Account deployment functionality
│   ├── fee-estimation.ts # Fee estimation and price conversion
│   ├── passkey.ts        # Passkey creation and management
│   ├── rain.ts           # Rain Card-specific operations
│   ├── recovery.ts       # Social recovery functionality
│   └── subaccount.ts     # Sub-account deployment and management
└── templates.ts          # Reusable transaction templates
```

## Architecture Layers

### 1. Core Layer

The core layer provides the fundamental building blocks for working with Safe accounts:

- **account.ts**: Manages Safe account creation, validation, and addresses
- **data.ts**: Retrieves and formats account information like balances, thresholds, and signers
- **operations.ts**: Provides low-level operations like transaction creation, signing, and sending
- **transactions.ts**: Handles transaction execution and tracking

### 2. Flow Patterns Layer

The flows layer defines standard transaction patterns that can be reused throughout the application:

- **direct.ts**: Implements the direct transaction flow where a Safe account directly executes transactions
- **nested.ts**: Implements the nested transaction flow where a Safe account executes transactions through another Safe account

### 3. Feature Layer

The features layer builds upon the core layer to implement specific features:

- **deploy.ts**: Handles account deployment with various configurations
- **fee-estimation.ts**: Provides utilities for estimating transaction fees and price conversion
- **passkey.ts**: Manages passkey creation, registration, and verification
- **rain.ts**: Implements Rain Card-specific operations like withdrawals
- **recovery.ts**: Manages social recovery setup and execution
- **subaccount.ts**: Handles sub-account deployment and management

### 4. Templates

The templates.ts file provides reusable transaction templates for common operations like ERC20 transfers, owner management, etc.

## Key Concepts

### Account Types

The module handles several types of accounts:

1. **Individual Account**: Primary account owned by a user, typically controlled via passkeys
2. **Settlement Account**: Account used for business operations, typically controlled by the individual account
3. **Sub-accounts**: Additional accounts for specific purposes (e.g., team accounts, special purpose accounts)

### Transaction Flows

The module supports two primary transaction flows:

1. **Direct Flow**: A transaction is executed directly by a Safe account
2. **Nested Flow**: A transaction is executed by a Safe account through another Safe account

### Authentication Methods

The module supports multiple authentication methods:

1. **Passkeys (WebAuthn)**: Secure authentication using device biometrics
2. **Social Recovery**: Account recovery through trusted guardians (email, phone)

## Usage Patterns

### Account Deployment

To deploy a new individual Safe account:

```typescript
import { deployIndividualSafe } from "@/utils/safe/features/deploy";

const { address, credentials, settlementAddress } = await deployIndividualSafe({
  email: "user@example.com",
  phone: "+1234567890",
  deploySettlement: true, // Optional: also deploy a settlement account
  callbacks: {
    onPasskeyCreated: () => {
      /* ... */
    },
    onDeployment: () => {
      /* ... */
    },
    onRecoverySetup: () => {
      /* ... */
    },
    onSuccess: () => {
      /* ... */
    },
    onError: (error) => {
      /* ... */
    },
  },
});
```

### Executing Transactions

To execute a direct transaction:

```typescript
import { executeDirectTransaction } from "@/utils/safe/flows/direct";
import { createERC20TransferTemplate } from "@/utils/safe/templates";

const transferTx = createERC20TransferTemplate({
  tokenAddress: "0x...", // Token address
  toAddress: "0x...", // Recipient address
  amount: "1.0", // Amount to transfer
  decimals: 6, // Token decimals
});

await executeDirectTransaction({
  safeAddress: "0x...", // Safe account address
  transactions: [transferTx],
  credentials: {
    /* ... */
  },
  callbacks: {
    /* ... */
  },
});
```

To execute a nested transaction:

```typescript
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { createERC20TransferTemplate } from "@/utils/safe/templates";

const transferTx = createERC20TransferTemplate({
  /* ... */
});

await executeNestedTransaction({
  fromSafeAddress: "0x...", // User's individual account
  throughSafeAddress: "0x...", // Settlement account
  transactions: [transferTx],
  credentials: {
    /* ... */
  },
  callbacks: {
    /* ... */
  },
});
```

### Social Recovery

To set up social recovery:

```typescript
import { setupSocialRecovery } from "@/utils/safe/features/recovery";

await setupSocialRecovery({
  walletAddress: "0x...", // Safe account address
  credentials: {
    /* ... */
  },
  recoveryMethods: {
    email: "user@example.com",
    phone: "+1234567890",
  },
  callbacks: {
    /* ... */
  },
});
```

### Rain Card Operations

To execute a Rain Card withdrawal:

```typescript
import { executeNestedTransferFromRainCardAccount } from "@/utils/safe/features/rain";

await executeNestedTransferFromRainCardAccount({
  fromSafeAddress: "0x...", // User's individual account
  throughSafeAddress: "0x...", // Destination account
  toAddress: "0x...", // Destination address
  tokenAddress: "0x...", // Token address
  tokenDecimals: 6, // Token decimals
  rainControllerAddress: "0x...", // Rain Card controller address
  rainCollateralProxyAddress: "0x...", // Rain Card proxy address
  amount: "1.0", // Amount to withdraw
  credentials: {
    /* ... */
  },
  callbacks: {
    /* ... */
  },
});
```

## Type Definitions

The module uses consistent parameter types throughout:

- **Address**: `0x`-prefixed hexadecimal string (from viem)
- **WebAuthnCredentials**: Passkey credentials object
- **Callbacks**: Event callbacks for transaction progress

## Error Handling

The module provides consistent error handling patterns:

1. All async functions return promises and propagate errors
2. Callbacks are provided to handle specific error cases
3. Errors are logged with detailed information

## Best Practices

### Consistency

- Always use object parameters for functions to ensure backward compatibility
- Always provide callback functions for error handling and progress tracking
- Use the appropriate flow pattern for the transaction type

### Security

- Never expose private keys or sensitive information
- Always validate input parameters
- Use the appropriate authentication method for the account type

### Performance

- Batch transactions when possible
- Use simulation to estimate fees and validate transactions
- Handle long-running operations with appropriate UI feedback

## Common Pitfalls

1. **Confusion between direct and nested flows**: Use direct flows for simple transactions, nested flows when one account needs to execute through another
2. **Missing callbacks**: Always provide callbacks for error handling and progress tracking
3. **Incorrect addresses**: Always validate addresses before sending transactions
4. **Insufficient gas**: Use simulation to estimate gas requirements
5. **Blocked user operations**: Some bundlers might block certain accounts or operations

## Future Improvements

1. **Enhanced error handling**: More detailed error messages and recovery options
2. **Better transaction batching**: Optimizing multi-step operations
3. **Account abstraction**: Supporting new ERC-4337 features
4. **Multi-chain support**: Extending to additional blockchains
5. **Enhanced simulation**: More accurate fee estimation and transaction validation
