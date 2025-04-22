"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Skeleton } from "@heroui/skeleton";
import {
  // ... other icons ...
  Wallet,
  CheckCircle,
  ChevronRight,
  Receipt,
  Send,
  Contact,
  Building,
  Building2,
  ShoppingBag,
  Terminal,
  CreditCard,
  List,
  Activity,
  Users,
  Users2,
  KeyRound,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  User,
  Shield,
  MessageCircle,
  PlusCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react"; // Import useMemo and useEffect
import { Spinner } from "@heroui/spinner"; // Import Spinner

import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { Account } from "@/types/account";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { useTheme } from "@/hooks/generics/useTheme"; // Import useTheme
import { ProfileSettingsModal } from "@/components/account-settings/profile-modal";
import { SecuritySettingsModal } from "@/components/account-settings/security-modal";
import { MerchantUserGetByIdOutput as MerchantUser } from "@monetic-labs/sdk";
import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { Badge as HeroBadge } from "@heroui/badge";

// Define structure with optional children
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  href?: string;
  children?: NavItem[];
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  isDisabled?: boolean;
  isComingSoon?: boolean;
  isCreateAccount?: boolean;
  isSkeleton?: boolean;
}

// Static definition of all top-level sections, including Accounts placeholder
const staticNavigationItems: NavItem[] = [
  {
    // Accounts placeholder
    id: "accounts-section",
    label: "Monetic Accounts",
    icon: <Wallet className="w-5 h-5" />,
    tooltip: "Select an account",
    href: "#", // Not a direct link itself
    children: [], // Children will be populated dynamically
  },
  {
    id: "bill-pay",
    label: "Bill Pay",
    icon: <Receipt className="w-5 h-5" />,
    tooltip: "Send payments and manage contacts",
    href: "/bill-pay",
  },
  {
    id: "back-office",
    label: "Back Office",
    icon: <Building2 className="w-5 h-5" />,
    tooltip: "Manage payments, orders, and settings",
    href: "/back-office",
    children: [
      {
        id: "back-office-payments",
        label: "Payments",
        icon: <Receipt className="w-4 h-4" />,
        tooltip: "View payments",
        href: "/back-office/payments",
      },
      {
        id: "back-office-orders",
        label: "Orders",
        icon: <ShoppingBag className="w-4 h-4" />,
        tooltip: "Manage orders",
        href: "/back-office/orders",
      },
      {
        id: "back-office-widget",
        label: "Widget",
        icon: <Terminal className="w-4 h-4" />,
        tooltip: "Manage widget settings",
        href: "/back-office/widget",
      },
    ],
  },
  {
    id: "card-issuance",
    label: "Card Issuance",
    icon: <CreditCard className="w-5 h-5" />,
    tooltip: "Issue and manage corporate cards",
    href: "/card-issuance",
    children: [
      {
        id: "card-issuance-cards",
        label: "Cards",
        icon: <List className="w-4 h-4" />,
        tooltip: "Manage cards",
        href: "/card-issuance/cards",
      },
      {
        id: "card-issuance-transactions",
        label: "Transactions",
        icon: <Activity className="w-4 h-4" />,
        tooltip: "View transactions",
        href: "/card-issuance/transactions",
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: <Users className="w-5 h-5" />,
    tooltip: "Manage team members and permissions",
    href: "/users",
    children: [
      {
        id: "users-members",
        label: "Members",
        icon: <Users2 className="w-4 h-4" />,
        tooltip: "Manage members",
        href: "/users/members",
      },
      {
        id: "users-developer",
        label: "Developer",
        icon: <KeyRound className="w-4 h-4" />,
        tooltip: "Manage developer access",
        href: "/users/developer",
      },
    ],
  },
];

// IDs of sections/items always enabled regardless of approval status - Removed as disabling logic is now global when not approved
// const ALWAYS_ENABLED_IDS = new Set(["users", "users-members", "users-developer"]);

// IDs of sections that should be visible but disabled during KYB
const VISIBLE_DURING_KYB = new Set(["users", "accounts-section"]);

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout, isFullyApproved, isLoading: isUserLoadingGlobal } = useUser();
  const { accounts, selectedAccount, setSelectedAccount, isLoadingAccounts } = useAccounts();
  const { toggleTheme, isDark } = useTheme();
  const { profile } = useUser();
  const { unreadCount } = useMessagingState();
  const {
    ui: { togglePane },
  } = useMessagingActions();

  // State for open sections (initialize based on path)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialOpenState: Record<string, boolean> = {};
    staticNavigationItems.forEach((item) => {
      if (item.children) {
        // Initial check based on href for non-account sections
        const isActive = item.children.some((child) => pathname?.startsWith(child.href || ""));
        // Initial check for accounts section based on path
        const isAccountActive = item.id === "accounts-section" && pathname?.startsWith("/account/");

        if (isActive || isAccountActive) {
          initialOpenState[item.id] = true;
        }
      }
    });
    // Optionally keep accounts open by default:
    // initialOpenState["accounts-section"] = true;
    return initialOpenState;
  });

  // State for loading indicator
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Effect to open sections based on path AND clear loading state
  useEffect(() => {
    setLoadingItemId(null); // Clear loading state on path change

    if (!pathname) return;

    setOpenSections((prev) => {
      const newState = { ...prev };
      staticNavigationItems.forEach((item) => {
        if (item.children) {
          const isAccountActive = item.id === "accounts-section" && pathname.startsWith("/account/");
          const isChildActive = item.children.some((child) => pathname.startsWith(child.href || "___NEVER_MATCH___"));
          if (isAccountActive || isChildActive) {
            newState[item.id] = true;
          }
        }
      });
      return newState;
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate dynamic navigation items
  const navigationItems = useMemo((): NavItem[] => {
    const generateAccountChildren = (): NavItem[] => {
      // Generate skeleton or actual accounts
      if (isLoadingAccounts) {
        return Array.from({ length: 2 }).map((_, index) => ({
          id: `skel-${index}`,
          label: `Loading...`,
          icon: <Wallet className="w-4 h-4" />,
          tooltip: "Loading...",
          href: "#",
          isDisabled: true,
          isSkeleton: true,
        }));
      }
      return accounts.map(
        (acc: Account): NavItem => ({
          id: acc.id,
          label: acc.name,
          icon: <acc.icon className="w-4 h-4" />,
          tooltip: `Select ${acc.name} account`,
          href: `/account/${acc.id}`,
          // Disable individual accounts if not approved OR if account itself is disabled/coming soon
          isDisabled: !isFullyApproved || acc.isDisabled || acc.isComingSoon || acc.isCreateAccount,
          isComingSoon: acc.isComingSoon,
          isCreateAccount: acc.isCreateAccount,
        })
      );
    };

    // Map over static structure, populating account children
    return staticNavigationItems.map((item) => {
      if (item.id === "accounts-section") {
        return {
          ...item,
          children: generateAccountChildren(),
          // Disable the main accounts section header if not approved
          isDisabled: !isFullyApproved,
          tooltip: isFullyApproved ? item.tooltip : "Complete verification to view accounts",
        };
      }
      return item;
    });
  }, [accounts, isLoadingAccounts, isFullyApproved]);

  // Recursive function to render navigation items
  const renderNavItems = (items: NavItem[], isSubmenu = false, parentIsDisabled = false) => {
    return items.map((item) => {
      // Determine if item should be disabled
      // Base disabled state: Checks approval, item's own flag, and parent's disabled status.
      const baseIsDisabled = !isFullyApproved || item.isDisabled || parentIsDisabled;

      const isLoading = loadingItemId === item.id;
      // Final disabled state for enabling/disabling interaction and visuals.
      const finalIsDisabled = baseIsDisabled || isLoading;
      const cursorClass = isLoading ? "cursor-wait" : baseIsDisabled ? "cursor-not-allowed" : "";

      // Selection checks remain the same
      const isCurrentPath = item.href && item.href !== "#" && pathname === item.href;
      const isAccountRoute = pathname?.startsWith("/account/");
      const isSelectedAccountItem = isAccountRoute && item.href === pathname;

      const isOpen = openSections[item.id] || false;
      const hasChildren = item.children && item.children.length > 0;

      const itemContent = (
        <>
          {item.icon && (
            <span className="mr-3 flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80">
              {item.icon}
            </span>
          )}
          <span className="flex-1 truncate">{item.label}</span>
          <div className="ml-auto flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isLoading ? (
              <Spinner size="sm" color="primary" />
            ) : (
              <>
                {item.isComingSoon && <span className="text-xs text-foreground/40">Soon</span>}
                {isSelectedAccountItem && !isSubmenu && <CheckCircle className="w-4 h-4 text-primary" />}
                {hasChildren && (
                  <ChevronRight
                    className={`w-4 h-4 text-foreground/60 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                )}
              </>
            )}
          </div>
        </>
      );

      const commonClasses = `
        flex items-center p-2 rounded-lg group w-full text-left transition-opacity
        ${isSubmenu ? "pl-5" : ""}
        ${finalIsDisabled ? `opacity-50 ${cursorClass}` : "hover:bg-content2 text-foreground/80"} 
        ${isSelectedAccountItem && !isSubmenu && !isLoading ? "bg-content2 text-foreground font-semibold" : ""} 
        ${isCurrentPath && !baseIsDisabled && !isLoading ? "bg-content2 text-foreground font-semibold" : ""}
      `;

      const handleItemClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        // Always check the final disabled state first
        if (finalIsDisabled) {
          e.preventDefault();
          return;
        }
        // Only set loading state if it's a clickable link with a valid destination
        if (!hasChildren && item.href && item.href !== "#") {
          setLoadingItemId(item.id);
        }
        // We don't need item.onClick here as section toggles use their own onClick
      };

      if (item.isSkeleton) {
        return (
          <li key={item.id} className="flex items-center p-2 space-x-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </li>
        );
      }

      // Render collapsible section or individual item
      if (hasChildren) {
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={finalIsDisabled || !item.tooltip} // Use final disabled state
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              closeDelay={0}
              content={item.tooltip}
              delay={500}
              placement="right"
            >
              <button
                type="button"
                className={commonClasses}
                // Use direct toggleSection, disabled state handles prevention
                onClick={() => toggleSection(item.id)}
                aria-expanded={isOpen}
                disabled={finalIsDisabled} // Use final disabled state
              >
                {itemContent}
              </button>
            </Tooltip>
            {/* Pass the base disabled state down */}
            {isOpen && <ul className="pt-1 pl-4 space-y-1">{renderNavItems(item.children!, true, baseIsDisabled)}</ul>}
          </li>
        );
      } else {
        // Render link item
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={finalIsDisabled || !item.tooltip} // Use final disabled state
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              closeDelay={0}
              content={item.tooltip}
              delay={500}
              placement="right"
            >
              <Link
                href={finalIsDisabled ? "#" : item.href || "#"} // Prevent navigation by changing href
                className={commonClasses}
                onClick={handleItemClick}
                aria-disabled={finalIsDisabled}
                tabIndex={finalIsDisabled ? -1 : undefined}
              >
                {itemContent}
              </Link>
            </Tooltip>
          </li>
        );
      }
    });
  };

  // State for modals now managed here
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const userSettingsHref = "/settings/user"; // Keep for potential future page

  // Simple logout handler
  const handleLogout = async () => {
    setLoadingItemId("logout"); // Show loading on logout button
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
      setLoadingItemId(null); // Clear loading on error
    }
    // Redirect handled by context, loading state cleared by path change
  };

  const initials = // Calculate initials for bottom avatar
    user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : undefined;

  const ChatButton = () => (
    <Tooltip content="Messages" placement="bottom">
      <Button
        isIconOnly
        size="sm"
        className="flex-shrink-0 bg-transparent text-foreground/60 hover:text-foreground/90"
        variant="light"
        onPress={() => {
          const event = new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true, metaKey: true });
          window.dispatchEvent(event);
        }}
      >
        <div className="relative">
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
          )}
          <HeroBadge color="primary" content={unreadCount} isInvisible={!unreadCount} shape="circle" size="sm">
            <MessageCircle className="w-5 h-5" />
          </HeroBadge>
        </div>
      </Button>
    </Tooltip>
  );

  // --- Skeleton Item Component (or inline JSX) ---
  const SkeletonNavItem = () => (
    <li className="flex items-center p-2 space-x-3">
      <Skeleton className="w-5 h-5 rounded-md" />
      <Skeleton className="w-32 h-4 rounded-md" />
      <Skeleton className="w-4 h-4 rounded-md ml-auto" /> {/* Placeholder for chevron */}
    </li>
  );

  return (
    <>
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-content1 border-r border-divider hidden lg:flex flex-col">
        {/* Top Section */}
        <div className="px-3 py-4 border-b border-divider flex items-center justify-between gap-1">
          {/* Company Dropdown */}
          <Dropdown placement="bottom-start">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex-grow justify-start px-1 text-foreground/80 hover:bg-content2 text-left mr-1"
                endContent={<ChevronDown className="w-4 h-4 text-foreground/60 flex-shrink-0" />}
              >
                <span className="truncate font-semibold">{user?.merchant?.company?.name || "Dashboard"}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Organization selector" selectedKeys={["current-org"]}>
              <DropdownItem
                key="current-org"
                startContent={<Building className="w-4 h-4" />}
                description="Current organization"
              >
                {user?.merchant?.company?.name || "Dashboard"}
              </DropdownItem>
              <DropdownItem
                key="add-org"
                startContent={<PlusCircle className="w-4 h-4" />}
                description="Coming Soon"
                isDisabled
              >
                Add Org
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          {/* Chat Button */}
          <ChatButton />
          {/* Theme Toggle Button */}
          <Tooltip content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} placement="bottom">
            <Button
              isIconOnly
              size="sm"
              className="flex-shrink-0 bg-transparent text-foreground/60 hover:text-foreground/90"
              variant="light"
              onPress={toggleTheme}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </Tooltip>
        </div>

        {/* Middle Section - Navigation or Skeletons */}
        <div className="flex-grow h-full px-3 py-4 overflow-y-auto relative">
          {isUserLoadingGlobal ? (
            // Show Skeletons during global load
            <ul className="space-y-2 font-medium">
              {staticNavigationItems.map((item) => (
                <SkeletonNavItem key={`skel-${item.id}`} />
              ))}
            </ul>
          ) : (
            // Show actual navigation items once loaded
            <ul className="space-y-2 font-medium">{renderNavItems(navigationItems)}</ul>
          )}
        </div>

        {/* Bottom Section - User Info / Settings Dropdown */}
        <div className="px-3 py-4 border-t border-divider">
          <Dropdown placement="top-start">
            <DropdownTrigger>
              <Button
                variant="light"
                className="w-full justify-start px-2 text-foreground/80 hover:bg-content2 disabled:opacity-50 disabled:cursor-wait"
                disabled={loadingItemId === "logout"}
              >
                <Avatar
                  isBordered
                  className="transition-transform flex-shrink-0"
                  classNames={{ base: "bg-primary/10", icon: "text-primary" }}
                  name={initials}
                  showFallback={!profile?.profileImage}
                  size="sm"
                  src={profile?.profileImage || undefined}
                />
                <div className="flex flex-col flex-grow text-left ml-2 min-w-0">
                  <span className="truncate">{user?.firstName || "User"}</span>
                  <span className="truncate text-xs text-foreground/60">{user?.email}</span>
                </div>
                {loadingItemId === "logout" ? (
                  <Spinner size="sm" color="current" className="ml-1 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-foreground/60 ml-1 flex-shrink-0" />
                )}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="User actions"
              disabledKeys={loadingItemId === "logout" ? ["profile", "security", "logout"] : []}
            >
              <DropdownItem
                key="profile"
                startContent={<User className="w-4 h-4" />}
                onPress={() => setIsProfileOpen(true)}
              >
                Profile
              </DropdownItem>
              <DropdownItem
                key="security"
                startContent={<Shield className="w-4 h-4" />}
                onPress={() => setIsSecurityOpen(true)}
              >
                Security
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogOut className="w-4 h-4" />}
                onPress={handleLogout}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Footer attribution */}
        <div className="px-3 py-2 text-center text-xs text-foreground/30 border-t border-divider">
          <span className="flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold">Monetic</span>
          </span>
        </div>
      </aside>

      {/* Render Modals needed by Sidebar actions */}
      {user && (
        <>
          <ProfileSettingsModal
            isOpen={isProfileOpen}
            user={user as MerchantUser}
            onClose={() => setIsProfileOpen(false)}
          />
          <SecuritySettingsModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
        </>
      )}
    </>
  );
}
