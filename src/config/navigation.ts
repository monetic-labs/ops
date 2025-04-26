import type { LucideIcon } from "lucide-react";
import {
  Wallet,
  Receipt,
  Building2,
  ShoppingBag,
  Terminal,
  CreditCard,
  MessageCircle,
  Sun,
  User,
  Shield,
  Users as UsersIcon,
  KeyRound,
  LogOut,
  Building,
  PlusCircle,
  SquareArrowDownRight,
} from "lucide-react";

// Define general types for navigation items
type NavAction = "toggleTheme" | "toggleChat" | "openProfileModal" | "openSecurityModal" | "logout";

interface BaseNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
  requiresApproval?: boolean; // Defaults to true if not specified, except for specific types
  children?: NavItem[];
}

// Type for standard links or sections with children
export interface NavItem extends BaseNavItem {
  href?: string; // Optional for sections that only toggle children
  type?: "link" | "section";
  isComingSoon?: boolean; // specific flags
  isCreateAccount?: boolean; // Flag for special account items
}

// Type for items that trigger actions rather than navigation
export interface ActionNavItem extends BaseNavItem {
  type: "action";
  action: NavAction;
}

// Type for items specific to the user menu (can be link or action)
export interface UserMenuItem extends BaseNavItem {
  type: "link" | "action" | "theme";
  href?: string;
  action?: NavAction; // Relevant if type is 'action' or 'theme'
  isDanger?: boolean;
}

// Type for items in the organization dropdown
export interface OrgMenuItem extends BaseNavItem {
  type: "link" | "action" | "display";
  href?: string;
  action?: NavAction;
  description?: string;
  isReadOnly?: boolean;
  isDisabled?: boolean; // For coming soon etc.
  className?: string; // For specific styling like pl-8
}

// --- Main Navigation Items (Sidebar & Mobile Bottom Nav) ---
export const mainNavigationItems: NavItem[] = [
  {
    id: "accounts-section", // Special ID for dynamic account list
    label: "Monetic Accounts",
    icon: Wallet,
    tooltip: "Select an account",
    requiresApproval: true,
    type: "section",
    href: "/", // Set href for mobile nav link
    children: [], // Populated dynamically in the hook/component later
  },
  {
    id: "bill-pay",
    label: "Bill Pay",
    icon: Receipt,
    tooltip: "Send payments and manage contacts",
    href: "/bill-pay",
    requiresApproval: true,
    type: "link",
  },
  {
    id: "payment-processing",
    label: "Payment Processing",
    icon: Building2,
    tooltip: "Manage payment requests and settings",
    href: "/payment-processing",
    requiresApproval: true,
    type: "link",
  },
  {
    id: "card-issuance",
    label: "Card Issuance",
    icon: CreditCard,
    tooltip: "Issue and manage corporate cards",
    href: "/card-issuance",
    requiresApproval: true,
    type: "link",
    // isComingSoon: true, // Example: If it were coming soon
  },
];

// --- User Menu Items ---

// Define the common items first
const commonUserMenuItems: UserMenuItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    type: "link",
    href: "/settings/profile",
    requiresApproval: false,
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    type: "link",
    href: "/settings/security",
    requiresApproval: false,
  },
  {
    id: "logout",
    label: "Sign Out",
    icon: LogOut,
    type: "action",
    action: "logout",
    requiresApproval: false,
    isDanger: true,
  },
];

// Specific items for Mobile Nav User Menu
export const mobileUserMenuItems: UserMenuItem[] = [
  // Section: Tools
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    type: "action",
    action: "toggleChat",
    requiresApproval: false,
  },
  {
    id: "theme",
    label: "Toggle Theme", // Label used internally, component shows 'Light/Dark Mode'
    icon: Sun, // Placeholder, component logic will show Sun/Moon
    type: "theme", // Special type for theme toggle logic
    action: "toggleTheme",
    requiresApproval: false,
  },
  // Section: Personal
  ...commonUserMenuItems.filter((item) => ["profile", "security"].includes(item.id)),
  // Section: Organization
  {
    id: "team-members",
    label: "Team Members",
    icon: UsersIcon,
    href: "/settings/team",
    type: "link",
    requiresApproval: true,
  },
  {
    id: "api-keys",
    label: "API Keys",
    icon: KeyRound,
    href: "/settings/api-keys",
    type: "link",
    requiresApproval: true,
  },
  // Section: Actions
  ...commonUserMenuItems.filter((item) => item.id === "logout"),
];

// Specific items for Sidebar User Menu (simpler)
export const sidebarUserMenuItems: UserMenuItem[] = [...commonUserMenuItems];

// --- Organization Menu Items (Sidebar Org Dropdown) ---
export const orgMenuItems: OrgMenuItem[] = [
  {
    id: "current-org-display",
    label: "My Organization", // Placeholder, will be replaced by actual org name
    icon: Building,
    type: "display",
    isReadOnly: true,
    className: "opacity-100 cursor-default",
    requiresApproval: false, // Display item always shown
  },
  {
    id: "api-keys-setting", // Different ID from user menu link
    label: "API Keys",
    icon: KeyRound,
    href: "/settings/api-keys",
    type: "link",
    requiresApproval: true,
  },
  {
    id: "team-setting", // Different ID from user menu link
    label: "Team Members",
    icon: UsersIcon,
    href: "/settings/team",
    type: "link",
    requiresApproval: true,
  },
  {
    id: "card-settlement-setting",
    label: "Card Settlement",
    icon: SquareArrowDownRight,
    href: "/settings/card-settlement",
    type: "link",
    requiresApproval: true,
  },
  {
    id: "add-org",
    label: "Add Org",
    icon: PlusCircle,
    type: "action", // Or 'link' if it goes somewhere
    description: "Coming Soon",
    isDisabled: true,
    requiresApproval: false, // Action item might be visible but disabled
  },
];
