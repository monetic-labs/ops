"use client";
import { useState } from "react";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { LogOut, User, Backpack, Shield, HelpCircle, Moon, Sun } from "lucide-react";

import pylon from "@/libs/pylon-sdk";
import { ExtendedMerchantUser, useAccounts } from "@/contexts/AccountContext";
import { LocalStorage } from "@/utils/localstorage";
import { getDisplayName } from "@/utils/helpers";
import { useTheme } from "@/hooks/useTheme";

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

const AuthenticatedNav = ({
  user,
  merchant,
  handleSignOut,
}: {
  user: ExtendedMerchantUser;
  merchant: { name: string };
  handleSignOut: () => Promise<void>;
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [dropdownKey, setDropdownKey] = useState(0);
  const { toggleTheme, isDark } = useTheme();

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
              <HelpCircle className="w-5 h-5" />
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
                  showFallback={!user.profileImage}
                  size="sm"
                  src={user.profileImage || undefined}
                />
                <UserInfo orgName={merchant?.name} userName={displayName} />
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
            onPress={() => window.open("https://support.backpack.fux", "_blank")}
          >
            <HelpCircle className="w-5 h-5" />
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
              showFallback={!user.profileImage}
              size="sm"
              src={user.profileImage || undefined}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Mobile user menu" className="w-[280px]" variant="flat">
            <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
              <UserInfo orgName={merchant?.name} userName={displayName} />
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

const UnauthenticatedNav = () => (
  <NavbarContent justify="end">
    <NavbarItem>
      <NextLink className="text-white/60 hover:text-white transition-colors" href="/auth">
        Sign In
      </NextLink>
    </NavbarItem>
  </NavbarContent>
);

export const Navbar = () => {
  const router = useRouter();
  const { merchant, user, isAuthenticated, isLoading } = useAccounts();

  const handleSignOut = async () => {
    try {
      await pylon.logout();
      LocalStorage.clearAuthState();
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
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
            <Backpack className="dark:text-white" size={24} strokeWidth={1.5} />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {isLoading ? null : isAuthenticated && user && merchant ? (
        <AuthenticatedNav handleSignOut={handleSignOut} merchant={merchant} user={user} />
      ) : (
        <UnauthenticatedNav />
      )}
    </NextUINavbar>
  );
};
