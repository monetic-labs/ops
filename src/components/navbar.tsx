"use client";
import { useState, useEffect } from "react";
import { NavbarBrand, NavbarContent, NavbarItem, Navbar as NextUINavbar } from "@heroui/navbar";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import { Backpack } from "lucide-react";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";

import { useUser, AuthStatus } from "@/contexts/UserContext";
import { getDisplayName } from "@/utils/helpers";
import { useAccounts } from "@/contexts/AccountContext";
import { LocalStorage } from "@/utils/localstorage";

import { MAIN_ACCOUNT } from "@/utils/constants";

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

const AuthenticatedNav = ({ user }: { user: MerchantUser }) => {
  const { profile } = useUser();
  const { accounts } = useAccounts();

  const operatingAccount = accounts.find(
    (account) => account.name.toLowerCase() === MAIN_ACCOUNT && account.isDeployed
  );
  const displayName = user.username || getDisplayName(user.firstName, user.lastName);
  const initials =
    user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : undefined;

  return (
    <>
      {/* Desktop Menu */}
      <NavbarContent className="hidden sm:flex flex-1" justify="end">
        <NavbarItem className="hidden sm:flex gap-2 items-center">
          <Avatar
            isBordered
            className="transition-transform"
            classNames={{ base: "bg-primary/10", icon: "text-primary" }}
            name={initials}
            showFallback={!profile?.profileImage}
            size="sm"
            src={profile?.profileImage || undefined}
          />
          <UserInfo orgName={user?.merchant.company.name} userName={displayName} />
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarContent className="sm:hidden flex-1" justify="end">
        <NavbarItem>
          <Avatar
            isBordered
            className="transition-transform"
            classNames={{ base: "bg-primary/10", icon: "text-primary" }}
            name={initials}
            showFallback={!profile?.profileImage}
            size="sm"
            src={profile?.profileImage || undefined}
          />
        </NavbarItem>
      </NavbarContent>
    </>
  );
};

const UnauthenticatedNav = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  return (
    <NavbarContent justify="end">
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
  const { user, isAuthenticated, isLoading } = useUser();
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

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
      {isLoading ? null : isAuthenticated && user ? <AuthenticatedNav user={user} /> : <UnauthenticatedNav />}
    </NextUINavbar>
  );
};
