import { Mail, Phone, Key, Backpack, Users } from "lucide-react";

import { RecoveryMethod } from "./types";

export const GRACE_PERIOD_OPTIONS = [
  { label: "3 Days", value: "3", description: "Shortest timelock, suitable for frequent users" },
  {
    label: "7 Days (Recommended)",
    value: "7",
    description: "Balanced timelock, recommended for most users",
    isRecommended: true,
  },
  { label: "14 Days", value: "14", description: "Maximum security, best for long-term holdings" },
];

export const DEAD_SWITCH_OPTIONS = [
  { label: "6 Months", value: "6", description: "Shortest inactivity period" },
  { label: "1 Year", value: "12", description: "Standard inactivity period", isRecommended: true },
  { label: "2 Years", value: "24", description: "Extended inactivity period" },
];

export const RECOVERY_OPTIONS = [
  {
    id: "email",
    title: "Email Recovery",
    description: "Verify an email to use it as a recovery option",
    icon: Mail,
    isConfigured: false,
    isComingSoon: false,
    method: "EMAIL" as RecoveryMethod,
  },
  {
    id: "phone",
    title: "Phone Recovery",
    description: "Use your phone number for secure recovery",
    icon: Phone,
    isConfigured: false,
    isComingSoon: false,
    method: "PHONE" as RecoveryMethod,
  },
  {
    id: "monetic",
    title: "Monetic Recovery",
    description: "Allow Monetic to help recover your account",
    icon: Backpack,
    isConfigured: false,
    isComingSoon: false,
    method: "MONETIC" as RecoveryMethod,
  },
  {
    id: "team",
    title: "Team Recovery",
    description: "Designate a team member to help recover your account",
    icon: Users,
    isConfigured: false,
    isComingSoon: true,
    method: "TEAM" as RecoveryMethod,
  },
  {
    id: "wallet",
    title: "Hardware Wallet",
    description: "Use a hardware security key as backup",
    icon: Key,
    isConfigured: false,
    isComingSoon: true,
    method: "HARDWARE" as RecoveryMethod,
  },
];
