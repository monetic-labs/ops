export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Self Banking Services",
  description: "Financial autonomy",
  version: "0.2.0",
  navItems: [
    {
      label: "Services",
      href: "/",
    },
    {
      label: "Sign Out",
      href: "/signout",
    },
  ],
  navMenuItems: [
    {
      label: "Services",
      href: "/services",
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
