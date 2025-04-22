"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Receipt,
  Building2,
  CreditCard,
  ShoppingBag,
  Terminal,
  User,
  Shield,
  KeyRound,
  LogOut,
  Users as UsersIcon,
  Settings,
  Sun,
  Moon,
  MessageCircle,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@heroui/skeleton";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown";
import { useState } from "react";
import { ProfileSettingsModal } from "@/components/account-settings/profile-modal";
import { SecuritySettingsModal } from "@/components/account-settings/security-modal";
import { MerchantUserGetByIdOutput as MerchantUser } from "@monetic-labs/sdk";
import { useTheme } from "@/hooks/generics/useTheme";
import { useMessagingActions } from "@/libs/messaging/store";
import { Badge as HeroBadge } from "@heroui/badge";
import { useMessagingState } from "@/libs/messaging/store";

// Define items specifically for the bottom nav (remove Users)
const bottomNavItems = [
  { id: "accounts", label: "Accounts", icon: Wallet, href: "/" },
  { id: "bill-pay", label: "Bill Pay", icon: Receipt, href: "/bill-pay" },
  { id: "card-issuance", label: "Cards", icon: CreditCard, href: "/card-issuance" },
];

// Define Back Office sub-items
const backOfficeSubItems = [
  {
    id: "back-office-payments",
    label: "Payments",
    icon: Receipt,
    href: "/back-office/payments",
  },
  {
    id: "back-office-orders",
    label: "Orders",
    icon: ShoppingBag,
    href: "/back-office/orders",
  },
  {
    id: "back-office-widget",
    label: "Widget",
    icon: Terminal,
    href: "/back-office/widget",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout, isFullyApproved, isLoading: isUserLoadingGlobal } = useUser();
  const { toggleTheme, isDark } = useTheme();
  const {
    ui: { togglePane },
  } = useMessagingActions();
  const { unreadCount } = useMessagingState();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/account/");
    if (href === "/back-office") return pathname.startsWith("/back-office");
    if (href === "/settings/api-keys" && pathname.startsWith("/settings")) return true;
    if (href === "/settings/team" && pathname.startsWith("/users")) return true;
    return pathname.startsWith(href);
  };

  const gridCols = bottomNavItems.length + 2;
  const accountMenuTriggerId = "account-menu-trigger";

  const mobileMenuDisabledKeys = [];
  if (!isFullyApproved) {
    mobileMenuDisabledKeys.push("api-keys");
    mobileMenuDisabledKeys.push("team-members");
    backOfficeSubItems.forEach((item) => mobileMenuDisabledKeys.push(item.id));
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-content1 border-t border-divider lg:hidden">
        <div
          className="grid h-full max-w-lg mx-auto font-medium items-center"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {isUserLoadingGlobal ? (
            Array.from({ length: gridCols }).map((_, index) => (
              <div key={`skel-mob-${index}`} className="flex justify-center items-center h-full">
                <Skeleton className="w-6 h-6 rounded-md" />
              </div>
            ))
          ) : (
            <>
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(item.href);
                const isDisabled = !isFullyApproved;
                return (
                  <Link
                    key={item.id}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                    className={`
                      inline-flex flex-col items-center justify-center px-1 pt-1 pb-1 h-full
                      group transition-colors duration-150 ease-in-out
                      ${isActive && !isDisabled ? "text-primary bg-primary/5" : "text-foreground/60"}
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2"}
                    `}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1 ${
                        isActive && !isDisabled
                          ? "text-primary"
                          : isDisabled
                            ? "text-foreground/30"
                            : "text-foreground/60 group-hover:text-foreground/90"
                      }`}
                    />
                  </Link>
                );
              })}

              <div className="flex justify-center items-center h-full">
                <Dropdown placement="top">
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      variant="light"
                      className={`text-foreground/60 hover:bg-content2 group h-full w-full flex flex-col items-center justify-center p-1 rounded-none ${
                        pathname.startsWith("/back-office") && isFullyApproved ? "text-primary bg-primary/5" : ""
                      } ${!isFullyApproved ? "opacity-50 cursor-not-allowed" : ""}`}
                      isDisabled={!isFullyApproved}
                      aria-label="Back Office Options"
                    >
                      <Building2
                        className={`w-5 h-5 mb-1 ${
                          pathname.startsWith("/back-office") && isFullyApproved
                            ? "text-primary"
                            : !isFullyApproved
                              ? "text-foreground/30"
                              : "text-foreground/60 group-hover:text-foreground/90"
                        }`}
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Back Office Actions"
                    items={backOfficeSubItems}
                    disabledKeys={!isFullyApproved ? backOfficeSubItems.map((i) => i.id) : []}
                  >
                    {(item) => {
                      const SubIcon = item.icon;
                      return (
                        <DropdownItem key={item.id} href={item.href} startContent={<SubIcon className="w-4 h-4" />}>
                          {item.label}
                        </DropdownItem>
                      );
                    }}
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="flex justify-center items-center h-full">
                <Dropdown placement="top-end">
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      variant="light"
                      className={`text-foreground/60 hover:bg-content2 group h-full w-full flex flex-col items-center justify-center p-1 rounded-none ${
                        (pathname.startsWith("/settings") || pathname.startsWith("/users")) && isFullyApproved
                          ? "text-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <Settings
                        className={`w-5 h-5 mb-1 ${
                          (pathname.startsWith("/settings") || pathname.startsWith("/users")) && isFullyApproved
                            ? "text-primary"
                            : "text-foreground/60 group-hover:text-foreground/90"
                        }`}
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Account and settings actions"
                    disabledKeys={mobileMenuDisabledKeys}
                    itemClasses={{ base: "pl-3 pr-3" }}
                  >
                    <DropdownSection title="Tools">
                      <DropdownItem
                        key="chat"
                        startContent={
                          <div className="relative">
                            {unreadCount > 0 && (
                              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-primary opacity-75" />
                            )}
                            <MessageCircle className="w-4 h-4" />
                          </div>
                        }
                        onPress={() => togglePane()}
                      >
                        Chat
                      </DropdownItem>
                      <DropdownItem
                        key="theme"
                        startContent={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        onPress={toggleTheme}
                      >
                        {isDark ? "Light Mode" : "Dark Mode"}
                      </DropdownItem>
                    </DropdownSection>

                    <DropdownSection title="Personal">
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
                    </DropdownSection>

                    <DropdownSection title="Organization">
                      <DropdownItem
                        key="team-members"
                        href="/settings/team"
                        startContent={<UsersIcon className="w-4 h-4" />}
                      >
                        Team Members
                      </DropdownItem>
                      <DropdownItem
                        key="api-keys"
                        href="/settings/api-keys"
                        startContent={<KeyRound className="w-4 h-4" />}
                      >
                        API Keys
                      </DropdownItem>
                    </DropdownSection>

                    <DropdownSection title="Actions">
                      <DropdownItem
                        key="logout"
                        className="text-danger"
                        color="danger"
                        startContent={<LogOut className="w-4 h-4" />}
                        onPress={logout}
                      >
                        Sign Out
                      </DropdownItem>
                    </DropdownSection>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Render Modals needed by actions */}
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
