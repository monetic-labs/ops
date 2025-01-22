"use client";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { LogOut, Settings, User, Backpack } from "lucide-react";

import { ThemeSwitch } from "@/components/theme-switch";
import pylon from "@/libs/pylon-sdk";
import { useAccounts } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";

interface UserInfoProps {
  userName?: string;
  orgName?: string;
}

const UserInfo = ({ userName, orgName }: UserInfoProps) => (
  <div className="flex flex-col items-start">
    <span className="text-sm font-medium">{userName || "User"}</span>
    <span className="text-xs text-default-500">{orgName || "Organization"}</span>
  </div>
);

const AuthenticatedNav = ({ user, merchant, handleSignOut }: any) => {
  const dropdownItems = (
    <>
      <DropdownItem
        key="profile"
        isReadOnly
        className="opacity-50"
        description="Coming Soon"
        startContent={<User className="w-4 h-4" />}
      >
        Profile
      </DropdownItem>
      <DropdownItem
        key="settings"
        isReadOnly
        className="opacity-50"
        description="Coming Soon"
        startContent={<Settings className="w-4 h-4" />}
      >
        Settings
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
          <ThemeSwitch />
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="bg-notpurple-500/20" name={user?.name || merchant?.name} size="sm" />
                <UserInfo orgName={merchant?.name} userName={user?.name} />
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
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar className="bg-notpurple-500/20 cursor-pointer" name={user?.name || merchant?.name} size="sm" />
          </DropdownTrigger>
          <DropdownMenu aria-label="Mobile user menu" className="w-[280px]" variant="flat">
            <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
              <UserInfo orgName={merchant?.name} userName={user?.name} />
            </DropdownItem>
            {dropdownItems}
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </>
  );
};

const UnauthenticatedNav = () => (
  <NavbarContent justify="end">
    <NavbarItem>
      <ThemeSwitch />
    </NavbarItem>
  </NavbarContent>
);

export const Navbar = () => {
  const router = useRouter();
  const { merchant, user } = useAccounts();
  const { isAuthenticated } = useAuth();

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

      {isAuthenticated ? (
        <AuthenticatedNav handleSignOut={handleSignOut} merchant={merchant} user={user} />
      ) : (
        <UnauthenticatedNav />
      )}
    </NextUINavbar>
  );
};
