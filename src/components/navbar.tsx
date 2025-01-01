"use client";
import { Link } from "@nextui-org/link";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { LogOut, Settings, User, Backpack } from "lucide-react";
import { Button } from "@nextui-org/button";

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
        startContent={<User className="w-4 h-4" />}
        description="Coming Soon"
        isReadOnly
        className="opacity-50"
      >
        Profile
      </DropdownItem>
      <DropdownItem
        key="settings"
        startContent={<Settings className="w-4 h-4" />}
        description="Coming Soon"
        isReadOnly
        className="opacity-50"
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
                <Avatar name={user?.name || merchant?.name} size="sm" className="bg-notpurple-500/20" />
                <UserInfo userName={user?.name} orgName={merchant?.name} />
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
            <Avatar name={user?.name || merchant?.name} size="sm" className="bg-notpurple-500/20 cursor-pointer" />
          </DropdownTrigger>
          <DropdownMenu aria-label="Mobile user menu" variant="flat" className="w-[280px]">
            <DropdownItem key="user-info" isReadOnly className="h-14 gap-2">
              <UserInfo userName={user?.name} orgName={merchant?.name} />
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
        <AuthenticatedNav 
          user={user} 
          merchant={merchant} 
          handleSignOut={handleSignOut} 
        />
      ) : (
        <UnauthenticatedNav />
      )}
    </NextUINavbar>
  );
};
