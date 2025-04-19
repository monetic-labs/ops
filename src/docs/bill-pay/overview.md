---
title: Bill Pay Overview
category: bill-pay
section: overview
type: guide
---

# Bill Pay System Overview

The Monetic Bill Pay system is a comprehensive payment management solution that seamlessly integrates traditional banking rails with blockchain technology through our pylon-sdk abstraction layer. It enables users to schedule and manage payments to vendors and service providers while leveraging the efficiency of digital assets behind the scenes.

## Core Features

### Payment Methods
- ACH Same Day Processing
- Wire Transfer Support
- USDC-powered settlement (abstracted from end-users)
- Customizable approval workflows
(Reference: `src/components/bill-pay/bill-actions/create.tsx` lines 47-54)

### Geographic Coverage
- Supports multiple countries including:
  - United States
  - Canada
  - Cayman Islands
  - British Virgin Islands
(Reference: `src/components/bill-pay/bill-actions/create.tsx` lines 34-39)

### Account Management
- Vendor profile creation and management
- Bank information validation and storage
- Routing number verification (9-digit)
- Account number handling (10-17 digits)
- Automated USDC liquidity management
(Reference: `src/components/bill-pay/bill-actions/fields/new-transfer.tsx` lines 41-67)

### Payment Processing
- Real-time fee calculation
- Automated USDC-to-fiat conversion
- Wire Message support (up to 35 characters)
- ACH Reference support (up to 10 characters)
(Reference: `src/components/bill-pay/bill-actions/fields/new-transfer.tsx` lines 98-115)

## Technical Infrastructure

### Blockchain Integration
- USDC smart contract integration via pylon-sdk
- Automated liquidity management
- Off-ramp routing through verified partners
(Reference: `src/hooks/bill-pay/useCreateBill.ts` lines 1-4)

### Settlement Process
1. Payment initiated in fiat currency
2. Automated USDC conversion and routing
3. Off-ramp to recipient's bank account
4. Real-time settlement status tracking

### Fee Structure
- ACH transfers: No additional fee
- Wire transfers: 2% processing fee
- USDC settlement: Automatically handled
(Reference: `src/components/bill-pay/bill-actions/create.tsx` lines 51-54)

## Interface Organization

The Bill Pay dashboard is organized into two main sections:
- Transfers: View and manage payment transactions
- Contacts: Manage vendor and recipient information
(Reference: `src/components/bill-pay/bill-pay.tsx` lines 13-22)

## Integration Points

The Bill Pay system integrates with:
- Traditional banking systems via ACH and Wire
- Blockchain networks via pylon-sdk
- Contact management for vendor information
- Transaction monitoring systems
- Compliance and audit systems

Note: While the system leverages blockchain technology and USDC for settlement, these technical details are abstracted away from the end-user experience, providing a familiar traditional banking interface while benefiting from the efficiency of digital assets.