"use client";
import { Link } from "@nextui-org/link";
import { NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, Navbar as NextUINavbar } from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { DiscordIcon, GithubIcon, Logo, TwitterIcon } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";
import pylon from "@/libs/pylon-sdk";

export const Navbar = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await pylon.logout();
    // TODO: validate statusCode
    router.refresh();
  };

  return (
    <NextUINavbar
      classNames={{
        base: "bg-charyo-900/70 text-notpurple-500 backdrop-blur-lg border-none",
      }}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Backpack</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              {item.label === "Sign Out" ? (
                <Link
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium"
                  )}
                  color="foreground"
                  href="#"
                  onClick={handleSignOut}
                >
                  {item.label}
                </Link>
              ) : (
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium"
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              )}
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
          <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>
    </NextUINavbar>
  );
};
