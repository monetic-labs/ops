"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Shield, User, Users } from "lucide-react"; // Example icons

interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const settingsNavItems: SettingsNavItem[] = [
  // Add other settings sections here later (e.g., Profile, Security)
  // {
  //   id: "profile",
  //   label: "Profile",
  //   href: "/settings/profile",
  //   icon: <User className="w-4 h-4" />,
  // },
  // {
  //   id: "security",
  //   label: "Security",
  //   href: "/settings/security",
  //   icon: <Shield className="w-4 h-4" />,
  // },
  {
    id: "api-keys",
    label: "API Keys",
    href: "/settings/api-keys",
    icon: <KeyRound className="w-4 h-4" />,
  },
  {
    id: "team",
    label: "Team Members",
    href: "/settings/team",
    icon: <Users className="w-4 h-4" />,
  },
];

function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1 w-full lg:w-48 lg:flex-shrink-0 lg:pr-4 mb-6 lg:mb-0">
      <h3 className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-foreground/50 tracking-wider">Organization</h3>
      {settingsNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`
              flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive ? "bg-content2 text-primary" : "text-foreground/70 hover:bg-content2 hover:text-foreground/90"}
            `}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-6">
      <SettingsNav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
