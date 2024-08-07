export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Merchant Services",
  description:
    "Your home to manage the various ways you access and instrument your value based transactions",
  version: "0.0.1",
  navItems: [
    {
      label: "Services",
      href: "/",
    },
    {
      label: "Office",
      href: "https://reup-office.vercel.app",
    },
    {
      label: "Accounts",
      href: "/accounts",
    },
    {
      label: "Rewards",
      href: "/rewards",
    },
    {
      label: "Support",
      href: "/support",
    },
  ],
  navMenuItems: [
    {
      label: "Services",
      href: "/services",
    },
    {
      label: "Office",
      href: "/office",
    },
    {
      label: "Accounts",
      href: "/accounts",
    },
    {
      label: "Rewards",
      href: "/rewards",
    },
    {
      label: "Support",
      href: "/support",
    },
    {
      label: "Compliance",
      href: "/compliance",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/backpack-fux",
    twitter: "https://twitter.com/backpack_fux",
    docs: "https://docs.backpack.network",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
