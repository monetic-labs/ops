"use client";
import { useState, useEffect } from "react";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { LogOut, User, Backpack, Shield } from "lucide-react";

import pylon from "@/libs/pylon-sdk";
import { ExtendedMerchantUser, useAccounts } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";

import { ProfileSettingsModal } from "./account-settings/profile-modal";
import { SecuritySettingsModal } from "./account-settings/security-modal";
import { getDisplayName, getFullName } from "@/utils/helpers";

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
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Load profile image from localStorage
    const storedImage = localStorage.getItem("@backpack/profile-image");
    if (storedImage) {
      setProfileImage(storedImage);
    }
  }, []);

  const displayName = user.username || getDisplayName(user.firstName, user.lastName);
  const initials =
    !profileImage && user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : undefined;

  const dropdownItems = (
    <>
      <DropdownItem key="profile" startContent={<User className="w-4 h-4" />} onClick={() => setIsProfileOpen(true)}>
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
    </>
  );

  return (
    <>
      {/* Desktop Menu */}
      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden sm:flex gap-4 items-center">
          <Dropdown key={`desktop-${dropdownKey}`} placement="bottom-end">
            <DropdownTrigger>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar
                  className="bg-notpurple-500/20"
                  src={profileImage || undefined}
                  name={initials}
                  size="sm"
                  showFallback={!profileImage}
                />
                <UserInfo orgName={merchant?.name} userName={displayName} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu" variant="flat">
              {dropdownItems}
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarContent className="sm:hidden" justify="end">
        <Dropdown key={`mobile-${dropdownKey}`} placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              className="bg-notpurple-500/20 cursor-pointer"
              src={profileImage || undefined}
              name={initials}
              size="sm"
              showFallback={!profileImage}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Mobile user menu" className="w-[280px]" variant="flat">
            <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
              <UserInfo orgName={merchant?.name} userName={displayName} />
            </DropdownItem>
            {dropdownItems}
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
    <NavbarItem>{/* <ThemeSwitch /> */}</NavbarItem>
  </NavbarContent>
);

export const Navbar = () => {
  const router = useRouter();
  const { merchant, user, isAuthenticated } = useAccounts();

  const handleSignOut = async () => {
    await pylon.logout();
    router.refresh();
  };

  return (
    <NextUINavbar
      classNames={{
        base: "bg-charyo-900/70 text-notpurple-500 backdrop-blur-lg border-none",
        wrapper: "px-4",
      }}
      maxWidth="xl"
      position="sticky"
    >
      {/* Logo */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Backpack className="text-notpurple-500" size={24} strokeWidth={1.5} />
            <p className="font-bold text-inherit">Backpack Services</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {isAuthenticated && user && merchant ? (
        <AuthenticatedNav handleSignOut={handleSignOut} merchant={merchant} user={user} />
      ) : (
        <UnauthenticatedNav />
      )}
    </NextUINavbar>
  );
};
