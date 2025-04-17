"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Backpack,
  User,
  Shield,
  MessageCircle,
  PlusCircle,
} from "lucide-react";
import { useState, useMemo } from "react"; // Import useMemo

import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { Account } from "@/types/account";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { useTheme } from "@/hooks/generics/useTheme"; // Import useTheme
import { ProfileSettingsModal } from "@/components/account-settings/profile-modal";
import { SecuritySettingsModal } from "@/components/account-settings/security-modal";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
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
    children: [
      {
        id: "bill-pay-transfers",
        label: "Transfers",
        icon: <Send className="w-4 h-4" />,
        tooltip: "View transfers",
        href: "/bill-pay/transfers",
      },
      {
        id: "bill-pay-contacts",
        label: "Contacts",
        icon: <Contact className="w-4 h-4" />,
        tooltip: "Manage contacts",
        href: "/bill-pay/contacts",
      },
    ],
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const { accounts, selectedAccount, setSelectedAccount, isLoadingAccounts } = useAccounts();
  const { toggleTheme, isDark } = useTheme(); // Use the theme hook
  const { profile } = useUser(); // Get profile for avatar src
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
        if (isActive) {
          initialOpenState[item.id] = true;
        }
      }
    });
    // Optionally keep accounts open by default:
    // initialOpenState["accounts-section"] = true;
    return initialOpenState;
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Generate dynamic navigation items using useMemo ---
  const navigationItems = useMemo((): NavItem[] => {
    // Function to generate account children (moved inside useMemo scope)
    const generateAccountChildren = (): NavItem[] => {
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
          href: "#",
          isDisabled: acc.isDisabled || acc.isComingSoon || acc.isCreateAccount,
          isComingSoon: acc.isComingSoon,
          isCreateAccount: acc.isCreateAccount,
          onClick: (e) => {
            e.preventDefault();
            if (!acc.isDisabled && !acc.isComingSoon && !acc.isCreateAccount) setSelectedAccount(acc);
          },
        })
      );
    };

    // Map over static structure, replacing children for accounts section
    return staticNavigationItems.map((item) => {
      if (item.id === "accounts-section") {
        return { ...item, children: generateAccountChildren() };
      }
      return item;
    });
  }, [accounts, isLoadingAccounts, setSelectedAccount]); // Dependencies for regeneration

  // Recursive function to render navigation items
  const renderNavItems = (items: NavItem[], isSubmenu = false) => {
    return items.map((item) => {
      // --- Minimal checks for this debug step ---
      const isSelectedAccountItem = item.id === selectedAccount?.id;
      const isOpen = openSections[item.id] || false;
      const hasChildren = item.children && item.children.length > 0;

      // --- Basic content structure ---
      const itemContent = (
        <>
          {/* Ensure item.icon exists before rendering */}
          {item.icon && (
            <span className="mr-3 flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80">
              {/* Render the actual icon */}
              {item.icon}
            </span>
          )}
          {/* Use a simple span for the label */}
          <span className="flex-1 truncate">{item.label}</span>
          {/* Indicators */}
          {item.isComingSoon && <span className="ml-auto text-xs text-foreground/40">Coming Soon</span>}
          {isSelectedAccountItem && !isSubmenu && (
            <CheckCircle className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 text-foreground/60 transition-transform ml-auto flex-shrink-0 ${isOpen ? "rotate-90" : ""}`}
            />
          )}
        </>
      );

      // --- Basic Styling ---
      const commonClasses = `
        flex items-center p-2 rounded-lg group w-full text-left
        ${isSubmenu ? "pl-5" : ""}
        ${item.isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2 text-foreground/80"}
        ${(isSelectedAccountItem && !isSubmenu) || (item.href && item.href !== "#" && pathname === item.href) ? "bg-content2 text-foreground font-semibold" : ""}
      `;

      // --- Simplified Conditional Rendering ---
      if (item.isSkeleton) {
        return (
          <li key={item.id} className="flex items-center p-2 space-x-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </li>
        );
      }

      if (hasChildren) {
        // Collapsible Section Trigger (Button)
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={item.isDisabled || !item.tooltip}
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              closeDelay={0}
              content={item.tooltip}
              delay={500}
              placement="right"
            >
              <button
                type="button"
                className={commonClasses}
                onClick={() => toggleSection(item.id)}
                aria-expanded={isOpen}
                disabled={item.isDisabled} // Disable button if item is disabled
              >
                {itemContent}
              </button>
            </Tooltip>
            {isOpen && <ul className="pt-1 pl-4 space-y-1">{renderNavItems(item.children!, true)}</ul>}
          </li>
        );
      } else {
        // Render link or button (account item)
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={item.isDisabled || !item.tooltip}
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              closeDelay={0}
              content={item.tooltip}
              delay={500}
              placement="right"
            >
              {item.onClick ? (
                <button type="button" onClick={item.onClick} className={commonClasses} disabled={item.isDisabled}>
                  {itemContent}
                </button>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={commonClasses}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    // ONLY prevent default for placeholder links or disabled items
                    if (item.href === "#" || item.isDisabled) {
                      e.preventDefault();
                    }
                    // Allow navigation for all other valid links
                  }}
                  aria-disabled={item.isDisabled}
                  tabIndex={item.isDisabled ? -1 : undefined}
                >
                  {itemContent}
                </Link>
              )}
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
    try {
      await logout();
      // Redirect handled by context or layout effect
    } catch (error) {
      console.error("Error during logout:", error);
    }
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

        {/* Middle Section */}
        <div className="flex-grow h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">{renderNavItems(navigationItems)}</ul>
        </div>

        {/* Bottom Section - User Info / Settings Dropdown */}
        <div className="px-3 py-4 border-t border-divider">
          <Dropdown placement="top-start">
            <DropdownTrigger>
              <Button variant="light" className="w-full justify-start px-2 text-foreground/80 hover:bg-content2">
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
                <ChevronDown className="w-4 h-4 text-foreground/60 ml-1 flex-shrink-0" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              {/* Add Profile Action */}
              <DropdownItem
                key="profile"
                startContent={<User className="w-4 h-4" />}
                onPress={() => setIsProfileOpen(true)} // Open profile modal
              >
                Profile
              </DropdownItem>
              {/* Add Security Action */}
              <DropdownItem
                key="security"
                startContent={<Shield className="w-4 h-4" />}
                onPress={() => setIsSecurityOpen(true)} // Open security modal
              >
                Security
              </DropdownItem>
              {/* Add Logout Action */}
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogOut className="w-4 h-4" />}
                onPress={handleLogout} // Call logout handler
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
      {user && ( // Ensure user exists before rendering modals that need it
        <>
          <ProfileSettingsModal
            isOpen={isProfileOpen}
            user={user as MerchantUser} // Cast user if needed
            onClose={() => setIsProfileOpen(false)}
          />
          <SecuritySettingsModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
        </>
      )}
    </>
  );
}
