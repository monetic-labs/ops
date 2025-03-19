"use client";
import { useState, useEffect } from "react";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { Button } from "@nextui-org/button";
import { Badge } from "@nextui-org/badge";
import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import { LogOut, User, Backpack, Shield, Moon, Sun, MessageCircle } from "lucide-react";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";

import { useUser, AuthStatus } from "@/contexts/UserContext";
import { getDisplayName } from "@/utils/helpers";
import { useTheme } from "@/hooks/generics/useTheme";
import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { useAccounts } from "@/contexts/AccountContext";
import { LocalStorage } from "@/utils/localstorage";

import { ProfileSettingsModal } from "./account-settings/profile-modal";
import { SecuritySettingsModal } from "./account-settings/security-modal";

interface UserInfoProps {
  userName?: string;
  orgName?: string;
}

const UserInfo = ({ userName, orgName }: UserInfoProps) => (
  <div className="flex flex-col items-start">
    <span className="text-sm font-medium">{userName}</span>
    <span className="text-xs text-default-500">{orgName || "Organization"}</span>
  </div>
);

const AuthenticatedNav = ({ user, handleSignOut }: { user: MerchantUser; handleSignOut: () => Promise<void> }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [dropdownKey, setDropdownKey] = useState(0);
  const { toggleTheme, isDark } = useTheme();
  const { unreadCount } = useMessagingState();
  const {
    ui: { togglePane },
  } = useMessagingActions();
  const { profile } = useUser();
  const { accounts } = useAccounts();

  // Find the operating account
  const operatingAccount = accounts.find((account) => account.name.toLowerCase() === "operating" && account.isDeployed);

  const displayName = user.username || getDisplayName(user.firstName, user.lastName);
  const initials =
    user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : undefined;

  return (
    <>
      {/* Desktop Menu */}
      <NavbarContent className="hidden sm:flex flex-1" justify="end">
        <div className="flex items-center gap-1">
          <NavbarItem>
            <Button
              isIconOnly
              className="bg-transparent text-foreground/60 hover:text-foreground"
              variant="light"
              onPress={toggleTheme}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              isIconOnly
              className="bg-transparent text-foreground/60 hover:text-foreground"
              variant="light"
              onPress={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  code: "KeyK",
                  ctrlKey: true,
                  metaKey: true,
                });

                window.dispatchEvent(event);
              }}
            >
              <div className="relative">
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 animate-ping rounded-full bg-primary opacity-75" />
                )}
                <Badge color="primary" content={unreadCount} isInvisible={!unreadCount} shape="circle" size="sm">
                  <MessageCircle className="w-5 h-5" />
                </Badge>
              </div>
            </Button>
          </NavbarItem>
        </div>
        <NavbarItem className="hidden sm:flex gap-4 items-center">
          <Dropdown key={`desktop-${dropdownKey}`} placement="bottom-end">
            <DropdownTrigger>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar
                  isBordered
                  className="transition-transform"
                  classNames={{
                    base: "bg-primary/10",
                    icon: "text-primary",
                  }}
                  name={initials}
                  showFallback={!profile?.profileImage}
                  size="sm"
                  src={profile?.profileImage || undefined}
                />
                <UserInfo orgName={user?.merchant.company.name} userName={displayName} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" variant="flat">
              <DropdownItem
                key="profile"
                startContent={<User className="w-4 h-4" />}
                onClick={() => setIsProfileOpen(true)}
              >
                Profile
              </DropdownItem>
              <DropdownItem
                key="security"
                startContent={<Shield className="w-4 h-4" />}
                onClick={() => setIsSecurityOpen(true)}
              >
                Security
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<LogOut className="w-4 h-4" />}
                onClick={handleSignOut}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarContent className="sm:hidden flex-1" justify="end">
        <NavbarItem>
          <Button
            isIconOnly
            className="bg-transparent text-foreground/60 hover:text-foreground"
            variant="light"
            onPress={toggleTheme}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button
            isIconOnly
            className="bg-transparent text-foreground/60 hover:text-foreground"
            variant="light"
            onPress={togglePane}
          >
            <div className="relative">
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 animate-ping rounded-full bg-primary opacity-75" />
              )}
              <Badge color="primary" content={unreadCount} isInvisible={!unreadCount} shape="circle" size="sm">
                <MessageCircle className="w-5 h-5" />
              </Badge>
            </div>
          </Button>
        </NavbarItem>
        <Dropdown key={`mobile-${dropdownKey}`} placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              className="transition-transform cursor-pointer"
              classNames={{
                base: "bg-primary/10",
                icon: "text-primary",
              }}
              name={initials}
              showFallback={!profile?.profileImage}
              size="sm"
              src={profile?.profileImage || undefined}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Mobile user menu" className="w-[280px]" variant="flat">
            <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
              <UserInfo orgName={user?.merchant.company.name} userName={displayName} />
            </DropdownItem>
            <DropdownItem
              key="profile"
              startContent={<User className="w-4 h-4" />}
              onClick={() => setIsProfileOpen(true)}
            >
              Profile
            </DropdownItem>
            <DropdownItem
              key="security"
              startContent={<Shield className="w-4 h-4" />}
              onClick={() => setIsSecurityOpen(true)}
            >
              Security
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="text-danger"
              color="danger"
              startContent={<LogOut className="w-4 h-4" />}
              onClick={handleSignOut}
            >
              Sign Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        user={user}
        onClose={() => {
          setIsProfileOpen(false);
          setDropdownKey((prev) => prev + 1);
        }}
      />

      <SecuritySettingsModal
        isOpen={isSecurityOpen}
        onClose={() => {
          setIsSecurityOpen(false);
          setDropdownKey((prev) => prev + 1);
        }}
      />
    </>
  );
};

const UnauthenticatedNav = () => {
  const { toggleTheme, isDark } = useTheme();
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  return (
    <NavbarContent justify="end">
      <NavbarItem>
        <Button
          isIconOnly
          className="bg-transparent text-foreground/60 hover:text-foreground"
          variant="light"
          onPress={toggleTheme}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </NavbarItem>
      {!isAuthPage && (
        <NavbarItem>
          <Button as={NextLink} className="bg-primary/10 hover:bg-primary/20 text-primary" href="/auth" variant="flat">
            Sign In
          </Button>
        </NavbarItem>
      )}
    </NavbarContent>
  );
};

export const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useUser();
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  // Simple logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <NextUINavbar
      classNames={{
        base: [
          "w-full bg-content1/90 text-foreground rounded-xl shadow-xl border border-border",
          "backdrop-blur-sm transition-all duration-200",
        ].join(" "),
        wrapper: "w-full px-4 max-w-full",
        content: "basis-auto flex-grow",
      }}
      shouldHideOnScroll={false}
    >
      {/* Logo */}
      <NavbarContent className="flex-none" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href={isAuthenticated ? "/" : "/auth"}>
            <Backpack className="text-primary" size={24} strokeWidth={1.5} />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Navigation content based on auth state */}
      {isLoading ? null : isAuthenticated && user ? (
        <AuthenticatedNav handleSignOut={handleLogout} user={user} />
      ) : (
        <UnauthenticatedNav />
      )}
    </NextUINavbar>
  );
};
