# Safe Roles Management

## Overview

The Safe Roles Management module provides a comprehensive system for managing permissions and access control in Safe accounts. It implements the Zodiac Roles Modifier pattern, allowing for granular control over what actions different addresses can perform.

## Key Concepts

### Roles

A role is a collection of permissions that can be assigned to any address. Each role is identified by a unique `roleKey` (a bytes32 value) and can have:

- Target permissions (access to all functions on a contract)
- Function permissions (access to specific functions)
- Scoped function permissions (access with parameter constraints)
- Allowances (rate limits on function calls)

### Execution Options

When granting permissions, you can specify how the function can be executed:

```typescript
enum ExecutionOptions {
  None = 0, // No execution allowed
  Send = 1, // Can execute as normal call
  DelegateCall = 2, // Can execute as delegatecall
  Both = 3, // Can execute either way
}
```

### Parameter Conditions

For scoped functions, you can add conditions on function parameters:

```typescript
interface RoleCondition {
  parent: number; // Parameter index
  paramType: ParameterType; // Static, Dynamic, or Dynamic32
  operator: Operator; // Comparison operator
  compValue: string; // Value to compare against
}
```

### Allowances

Allowances provide rate limiting for function calls:

```typescript
interface Allowance {
  amount: bigint; // Amount allowed
  period: number; // Time period in seconds
}
```

## Usage Examples

### 1. Basic Role Setup

```typescript
import { setupRole, ExecutionOptions } from "@/utils/safe/features/roles";

// Set up a basic role
await setupRole(
  safeAddress,
  rolesModAddress,
  "TREASURY_MANAGER",
  memberAddress,
  [
    {
      type: "target",
      targetAddress: treasuryAddress,
      options: ExecutionOptions.Send,
    },
  ],
  credentials
);
```

### 2. Function-Specific Permissions

```typescript
// Allow specific functions
await setupRole(
  safeAddress,
  rolesModAddress,
  "TOKEN_MANAGER",
  memberAddress,
  [
    {
      type: "function",
      targetAddress: tokenAddress,
      functionSignature: "transfer(address,uint256)",
      options: ExecutionOptions.Send,
    },
  ],
  credentials
);
```

### 3. Scoped Function with Conditions

```typescript
// Add parameter constraints
await setupRole(
  safeAddress,
  rolesModAddress,
  "LIMITED_SPENDER",
  memberAddress,
  [
    {
      type: "scopedFunction",
      targetAddress: tokenAddress,
      functionSignature: "transfer(address,uint256)",
      conditions: [
        {
          parent: 1, // Second parameter (amount)
          paramType: ParameterType.Static,
          operator: Operator.LessThanOrEqual,
          compValue: "0x1000", // Max amount
        },
      ],
      options: ExecutionOptions.Send,
    },
  ],
  credentials
);
```

### 4. Role with Allowance

```typescript
// Add rate limiting
await setupRole(
  safeAddress,
  rolesModAddress,
  "DAILY_SPENDER",
  memberAddress,
  [
    {
      type: "function",
      targetAddress: tokenAddress,
      functionSignature: "transfer(address,uint256)",
      options: ExecutionOptions.Send,
      allowance: {
        amount: BigInt(1000000), // Amount per period
        period: 86400, // 24 hours
      },
    },
  ],
  credentials
);
```

## Best Practices

1. **Role Naming**

   - Use descriptive, uppercase names for roles
   - Include the scope in the name (e.g., TREASURY_MANAGER, TOKEN_SPENDER)
   - Document the purpose of each role

2. **Permission Granularity**

   - Start with minimal permissions and add as needed
   - Prefer function-specific permissions over target-wide access
   - Use parameter conditions to enforce limits
   - Add allowances for sensitive operations

3. **Security Considerations**

   - Regularly audit role assignments
   - Use allowances for high-value operations
   - Implement parameter conditions for sensitive functions
   - Monitor role usage through events

4. **Maintenance**
   - Keep documentation of all roles and their purposes
   - Review and update permissions as needs change
   - Remove unused roles and permissions
   - Maintain an audit trail of role changes

## Error Handling

The module includes comprehensive error handling:

```typescript
try {
  await setupRole(/* ... */);
} catch (error) {
  if (error.message.includes("NotAuthorized")) {
    // Handle unauthorized access
  } else if (error.message.includes("InvalidModule")) {
    // Handle invalid module
  } else {
    // Handle other errors
  }
}
```

## Events

The Roles Modifier emits events for all important actions:

- `AssignRoles`: When roles are assigned to an address
- `AllowTarget`: When target permissions are granted
- `AllowFunction`: When function permissions are granted
- `ScopeFunction`: When function conditions are set
- `SetAllowance`: When allowances are configured

## Architecture

The Roles Management module is integrated into the Safe Module Architecture:

```
Safe Module Architecture
├── features/
│   └── roles.ts       # Role management implementation
├── core/
│   └── transactions.ts # Transaction execution
└── abi/
    └── rolesv3.ts     # Role modifier ABI
```

## Future Improvements

1. **Enhanced Role Templates**

   - Pre-configured role templates for common use cases
   - Role inheritance and composition
   - Role groups and hierarchies

2. **Advanced Conditions**

   - Time-based permissions
   - Multi-parameter conditions
   - Dynamic condition updates

3. **Monitoring and Analytics**

   - Role usage analytics
   - Permission audit trails
   - Anomaly detection

4. **UI Components**
   - Role management dashboard
   - Permission visualization
   - Bulk role operations

## Common Pitfalls

1. **Over-privileged Roles**

   - Granting more permissions than necessary
   - Not using parameter conditions
   - Missing allowances on sensitive functions

2. **Insufficient Monitoring**

   - Not tracking role usage
   - Missing alerts for sensitive operations
   - Lack of regular audits

3. **Poor Role Organization**

   - Unclear role purposes
   - Overlapping permissions
   - Missing documentation

4. **Security Risks**
   - Unscoped function permissions
   - Missing parameter validation
   - Inadequate rate limiting
