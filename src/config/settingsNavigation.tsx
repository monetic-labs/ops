import { KeyRound, Shield, User, Users, SquareArrowDownRight } from "lucide-react";

// Export Types and Data for use in page.tsx
export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}

export const settingsSections: SettingsSection[] = [
  {
    title: "Personal",
    items: [
      {
        id: "profile",
        label: "Profile",
        href: "/settings/profile",
        icon: <User className="w-4 h-4" />,
      },
      {
        id: "security",
        label: "Security",
        href: "/settings/security",
        icon: <Shield className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Organization",
    items: [
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
      {
        id: "card-settlement",
        label: "Card Settlement",
        href: "/settings/card-settlement",
        icon: <SquareArrowDownRight className="w-4 h-4" />,
      },
    ],
  },
];
