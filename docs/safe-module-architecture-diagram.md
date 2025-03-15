# Safe Module Architecture Diagrams

## Layer Structure

```
+--------------------------------------------------+
|                  Application Layer               |
|  (Components, Pages, Hooks that use Safe Module) |
+--------------------------------------------------+
                         ↓
+--------------------------------------------------+
|                 Safe Module Index                |
|      (Re-exports and unified entry points)       |
+--------------------------------------------------+
                         ↓
+-----------+--------------+----------------+
|  Features |    Flows     |    Templates   |
|           |              |                |
| deploy.ts |  direct.ts   |  templates.ts  |
| fee-estimation.ts|nested.ts|              |
| passkey.ts|              |                |
| rain.ts   |              |                |
| recovery.ts|             |                |
| subaccount.ts|           |                |
+-----------+--------------+----------------+
                 ↓                  ↑
            +-----------+
            |   Core    |
            |           |
            | account.ts|
            | data.ts   |
            | operations.ts|
            | transactions.ts|
            +-----------+
                 ↓
       +-------------------+
       | External Libraries|
       |                   |
       | abstractionkit   |
       | viem             |
       | pylon-sdk        |
       +-------------------+
```

## Transaction Flow Diagrams

### Direct Transaction Flow

```
+----------------+        +----------------+        +-----------------+
| User Interface |        |  Direct Flow   |        |   Blockchain    |
|                |        |                |        |                 |
| +------------+ |        | +------------+ |        | +-------------+ |
| |  User      | |   1    | | Execute    | |   3    | |  Safe       | |
| |  Action    |---------->| Direct      |---------->|  Account     | |
| +------------+ |        | | Transaction| |        | +-------------+ |
|                |        | +------------+ |        |                 |
|                |        |       |        |        |                 |
|                |        |       | 2      |        |                 |
|                |        |       v        |        |                 |
|                |        | +------------+ |        |                 |
|                |        | | Create     | |        |                 |
|                |        | | Transaction| |        |                 |
|                |        | +------------+ |        |                 |
+----------------+        +----------------+        +-----------------+
```

### Nested Transaction Flow

```
+----------------+        +----------------+        +-----------------+
| User Interface |        |  Nested Flow   |        |   Blockchain    |
|                |        |                |        |                 |
| +------------+ |        | +------------+ |        | +-------------+ |
| |  User      | |   1    | | Execute    | |   3    | | Individual  | |
| |  Action    |---------->| Nested      |---------->| Safe Account | |
| +------------+ |        | | Transaction| |        |        |        |
|                |        | +------------+ |        |        |        |
|                |        |       |        |        |        | 4      |
|                |        |       | 2      |        |        v        |
|                |        |       v        |        | +-------------+ |
|                |        | +------------+ |        | | Settlement  | |
|                |        | | Create     | |        | | Safe Account| |
|                |        | | Transaction| |        | +-------------+ |
|                |        | +------------+ |        |        |        |
|                |        |                |        |        | 5      |
|                |        |                |        |        v        |
|                |        |                |        | +-------------+ |
|                |        |                |        | | Destination | |
|                |        |                |        | +-------------+ |
+----------------+        +----------------+        +-----------------+
```

### Rain Card Withdrawal Flow

```
+----------------+        +----------------+        +-----------------+
| User Interface |        |  Rain Feature  |        |   Blockchain    |
|                |        |                |        |                 |
| +------------+ |   1    | +------------+ |   3    | +-------------+ |
| |  User      |---------->| Execute     |---------->| Individual   | |
| |  Action    | |        | | Rain Card  | |        | | Safe Account| |
| +------------+ |        | | Withdrawal | |        | +-------------+ |
|                |        | +------------+ |        |        |        |
|                |        |       |        |        |        | 4      |
|                |        |       | 2      |        |        v        |
|                |        |       v        |        | +-------------+ |
|                |        | +------------+ |        | | Rain Card   | |
|                |        | | Get        | |        | | Account     | |
|                |        | | Withdrawal | |        | +-------------+ |
|                |        | | Signature  | |        |        |        |
|                |        | +------------+ |        |        | 5      |
|                |        |                |        |        v        |
|                |        |                |        | +-------------+ |
|                |        |                |        | | Destination | |
|                |        |                |        | +-------------+ |
+----------------+        +----------------+        +-----------------+
```

## Account Creation and Recovery Diagram

```
+----------------+        +----------------+        +-----------------+
| User Interface |        | Deploy Feature |        |   Blockchain    |
|                |        |                |        |                 |
| +------------+ |   1    | +------------+ |   3    | +-------------+ |
| |  User      |---------->| Deploy      |---------->| Individual   | |
| |  Signs Up  | |        | | Individual | |        | | Safe Account| |
| +------------+ |        | | Safe       | |        | +-------------+ |
|                |        | +------------+ |        |        |        |
|                |        |       |        |        |        | 4      |
|                |        |       | 2      |        |        v        |
|                |        |       v        |        | +-------------+ |
|                |        | +------------+ |        | | Social      | |
|                |        | | Setup      | |        | | Recovery    | |
|                |        | | Social     | |        | | Module     | |
|                |        | | Recovery   | |        | +-------------+ |
|                |        | +------------+ |        |                 |
|                |        |       |        |        |                 |
|                |        |       | 5      |        |                 |
|                |        |       v        |        |                 |
|                |        | +------------+ |        |                 |
|                |        | | Deploy     | |   6    | +-------------+ |
|                |        | | Settlement |---------->| Settlement   | |
|                |        | | Account    | |        | | Safe Account| |
|                |        | +------------+ |        | +-------------+ |
+----------------+        +----------------+        +-----------------+
```
