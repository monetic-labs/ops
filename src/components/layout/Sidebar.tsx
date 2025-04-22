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
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react"; // Import useMemo and useEffect
import { Spinner } from "@heroui/spinner"; // Import Spinner

import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { Account } from "@/types/account";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, DropdownSection } from "@heroui/dropdown";
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
  },
];

// IDs of sections/items always enabled regardless of approval status - Removed as disabling logic is now global when not approved
// const ALWAYS_ENABLED_IDS = new Set(["users", "users-members", "users-developer"]);

// IDs of sections that should be visible but disabled during KYB
const VISIBLE_DURING_KYB = new Set(["users", "accounts-section"]);

// Define props for Sidebar
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// Accept props in the component function
export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
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
        const isActive = item.children.some((child) => pathname?.startsWith(child.href || ""));
        const isAccountActive = item.id === "accounts-section" && pathname?.startsWith("/account/");
        if (isActive || isAccountActive) {
          initialOpenState[item.id] = true;
        }
      }
    });
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

      // --- Collapsed State with Children: Render Dropdown ---
      if (isCollapsed && hasChildren) {
        // Ensure children exist before mapping for disabledKeys and passing to items
        const childItems = item.children || [];
        const disabledChildKeys = childItems
          .filter((child) => !isFullyApproved || child.isDisabled || finalIsDisabled)
          .map((child) => child.id);

        return (
          <li key={item.id}>
            <Dropdown placement="right-start">
              <Tooltip content={item.tooltip} isDisabled={finalIsDisabled} placement="right">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    className={`p-2 rounded-lg group w-full text-left transition-opacity justify-center ${
                      finalIsDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2 text-foreground/80"
                    }`}
                    aria-label={item.label}
                    isDisabled={finalIsDisabled}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80 mx-auto">
                        {item.icon}
                      </span>
                    )}
                  </Button>
                </DropdownTrigger>
              </Tooltip>
              <DropdownMenu aria-label={`${item.label} submenu`} items={childItems} disabledKeys={disabledChildKeys}>
                {(child) => (
                  <DropdownItem key={child.id} href={child.href} startContent={child.icon}>
                    {child.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </li>
        );
      }
      // --- Expanded State with Children: Render Collapsible Button ---
      else if (!isCollapsed && hasChildren) {
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
                  <ChevronRight
                    className={`w-4 h-4 text-foreground/60 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </>
              )}
            </div>
          </>
        );
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={finalIsDisabled || !item.tooltip}
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              content={item.tooltip}
              placement="right"
            >
              <button
                type="button"
                className={`flex items-center p-2 rounded-lg group w-full text-left transition-opacity ${
                  isSubmenu ? "pl-5" : ""
                } ${finalIsDisabled ? `opacity-50 ${cursorClass}` : "hover:bg-content2 text-foreground/80"}`}
                onClick={() => toggleSection(item.id)}
                aria-expanded={isOpen}
                disabled={finalIsDisabled}
              >
                {itemContent}
              </button>
            </Tooltip>
            {isOpen && <ul className="pt-1 pl-4 space-y-1">{renderNavItems(item.children!, true, baseIsDisabled)}</ul>}
          </li>
        );
      }
      // --- Item without Children (Collapsed or Expanded) ---
      else {
        const itemContent = (
          <>
            {item.icon && (
              <span
                className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80 ${
                  isCollapsed ? "mx-auto" : "mr-3"
                }`}
              >
                {item.icon}
              </span>
            )}
            {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!isCollapsed && (
              <div className="ml-auto flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isLoading ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <>
                    {item.isComingSoon && <span className="text-xs text-foreground/40">Soon</span>}
                    {isSelectedAccountItem && !isSubmenu && <CheckCircle className="w-4 h-4 text-primary" />}
                    {/* No ChevronRight needed here */}
                  </>
                )}
              </div>
            )}
          </>
        );
        const commonClasses = `
          flex items-center p-2 rounded-lg group w-full text-left transition-opacity
          ${isSubmenu ? "pl-5" : ""}
          ${finalIsDisabled ? `opacity-50 ${cursorClass}` : "hover:bg-content2 text-foreground/80"} 
          ${isSelectedAccountItem && !isSubmenu && !isLoading ? "bg-content2 text-foreground font-semibold" : ""} 
          ${isCurrentPath && !baseIsDisabled && !isLoading ? "bg-content2 text-foreground font-semibold" : ""}
          ${isCollapsed ? "justify-center" : ""}
      `;
        `;

        `;

        const handleItemClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
          const handleItemClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
            // Always check the final disabled state first
            const handleItemClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
              // Always check the final disabled state first
              if (finalIsDisabled) {
                e.preventDefault();
                return;
              }
              if (item.href && item.href !== "#") {
                setLoadingItemId(item.id);
              }
            };
          };
        };

        if (item.isSkeleton) {
          return (
            <li key={item.id} className={`flex items-center p-2 space-x-3 ${isCollapsed ? "justify-center" : ""}`}>
              <Skeleton className={`w-5 h-5 rounded-${isCollapsed ? "full" : "md"}`} />
              {!isCollapsed && <Skeleton className="w-24 h-4 rounded-md" />}
            </li>
          );
        }
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={finalIsDisabled || !item.tooltip || !isCollapsed} // Only enable tooltip when collapsed
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              content={item.tooltip}
              placement="right"
            >
              <Link
                href={finalIsDisabled ? "#" : item.href || "#"}
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
    <Tooltip content="Customer Support" placement={isCollapsed ? "right" : "bottom"}>
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
    <li className={`flex items-center p-2 space-x-3 ${isCollapsed ? "justify-center" : ""}`}>
      <Skeleton className={`w-5 h-5 rounded-${isCollapsed ? "full" : "md"}`} />
      {!isCollapsed && <Skeleton className="w-32 h-4 rounded-md" />}
      {!isCollapsed && <Skeleton className="w-4 h-4 rounded-md ml-auto" />}
    </li>
  );

  const currentOrgName = user?.merchant?.company?.name || "My Organization";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-content1 border-r border-divider hidden lg:flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Section - Only Company Info/Dropdown */}
        <div className="px-3 py-4 border-b border-divider">
          {!isCollapsed ? (
            // Expanded State: Dropdown with Org Name Trigger
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <Button
                  variant="light"
                  className="flex-grow justify-start px-1 text-foreground/80 hover:bg-content2 text-left mr-1 w-full"
                  endContent={<ChevronDown className="w-4 h-4 text-foreground/60 flex-shrink-0" />}
                >
                  <span className="truncate font-semibold">{currentOrgName}</span>
                </Button>
              </DropdownTrigger>
              {/* Expanded Dropdown Menu Content */}
              <DropdownMenu
                aria-label={`Actions and settings for ${currentOrgName}`}
                disabledKeys={!isFullyApproved ? ["api-keys-setting", "team-setting"] : []}
              >
                <DropdownItem
                  key="current-org-display"
                  isReadOnly
                  startContent={<Building className="w-4 h-4 text-foreground/60" />}
                  className="opacity-100 cursor-default"
                >
                  {currentOrgName}
                </DropdownItem>
                <DropdownItem
                  key="api-keys-setting"
                  href="/settings/api-keys"
                  startContent={<KeyRound className="w-4 h-4" />}
                  className="pl-8"
                >
                  API Keys
                </DropdownItem>
                <DropdownItem
                  key="team-setting"
                  href="/settings/team"
                  startContent={<Users className="w-4 h-4" />}
                  className="pl-8"
                >
                  Team Members
                </DropdownItem>
                <DropdownSection aria-label="Organization Actions">
                  <DropdownItem
                    key="add-org"
                    startContent={<PlusCircle className="w-4 h-4" />}
                    description="Coming Soon"
                    isDisabled
                  >
                    Add Org
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          ) : (
            // Collapsed state: Dropdown with centered Building Icon Trigger
            <Dropdown placement="right-start">
              <Tooltip content={currentOrgName} placement="right">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    className="flex items-center justify-center w-full h-[36px] p-1 rounded-lg hover:bg-content2"
                    aria-label={currentOrgName}
                  >
                    <Building className="w-5 h-5 text-foreground/60" />
                  </Button>
                </DropdownTrigger>
              </Tooltip>
              {/* Collapsed Dropdown Menu Content (same as before) */}
              <DropdownMenu
                aria-label={`Actions and settings for ${currentOrgName}`}
                disabledKeys={!isFullyApproved ? ["api-keys-setting", "team-setting"] : []}
              >
                <DropdownItem
                  key="api-keys-setting"
                  href="/settings/api-keys"
                  startContent={<KeyRound className="w-4 h-4" />}
                >
                  API Keys
                </DropdownItem>
                <DropdownItem key="team-setting" href="/users" startContent={<Users className="w-4 h-4" />}>
                  Team Members
                </DropdownItem>
                <DropdownSection aria-label="Organization Actions">
                  <DropdownItem
                    key="add-org"
                    startContent={<PlusCircle className="w-4 h-4" />}
                    description="Coming Soon"
                    isDisabled
                  >
                    Add Org
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>

        {/* Middle Section - Navigation or Skeletons */}
        <div
          className={`flex-grow h-full py-4 overflow-y-auto relative ${isCollapsed ? "overflow-x-hidden px-1" : "px-3"}`}
        >
          {isUserLoadingGlobal ? (
            <ul className="space-y-2 font-medium">{/* ... Skeletons ... */}</ul>
          ) : (
            <ul className="space-y-2 font-medium">{renderNavItems(navigationItems)}</ul>
          )}
        </div>

        {/* Bottom Actions Section - Updated Padding */}
        <div
          className={`flex items-center gap-2 py-2 border-t border-divider ${
            isCollapsed ? "flex-col px-1" : "flex-row justify-center px-3"
          }`}
        >
          <ChatButton />
          <Tooltip
            content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            placement={isCollapsed ? "right" : "bottom"}
          >
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent text-foreground/60 hover:text-foreground/90"
              variant="light"
              onPress={toggleTheme}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </Tooltip>
          <Tooltip
            content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            placement={isCollapsed ? "right" : "bottom"}
          >
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent text-foreground/60 hover:text-foreground/90"
              variant="light"
              onPress={toggleSidebar}
            >
              {isCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </Button>
          </Tooltip>
        </div>

        {/* Bottom User Profile Section - Updated Padding */}
        <div className={`py-4 border-t border-divider ${isCollapsed ? "px-1" : "px-3"}`}>
          {/* ... User Dropdown (always visible now) ... */}
          <Dropdown placement={isCollapsed ? "right-start" : "top-start"}>
            <DropdownTrigger>
              <Button
                variant="light"
                className={`w-full justify-start px-2 text-foreground/80 hover:bg-content2 disabled:opacity-50 disabled:cursor-wait ${
                  isCollapsed ? "justify-center !px-0" : ""
                }`}
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
                {!isCollapsed && (
                  <div className="flex flex-col flex-grow text-left ml-2 min-w-0">
                    <span className="truncate">{user?.firstName || "User"}</span>
                    <span className="truncate text-xs text-foreground/60">{user?.email}</span>
                  </div>
                )}
                {!isCollapsed && <>{/* ... chevron/spinner ... */}</>}
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

        {/* Footer attribution - still hide when collapsed */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-center text-xs text-foreground/30 border-t border-divider">
            <span className="flex items-center justify-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold">Monetic</span>
            </span>
          </div>
        )}
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
