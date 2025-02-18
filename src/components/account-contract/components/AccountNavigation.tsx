import { Button } from "@nextui-org/button";
import { Activity, Users, Shield } from "lucide-react";

interface NavigationItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  badge?: {
    text: string;
    className: string;
  };
}

interface AccountNavigationProps {
  selectedTab: string;
  onTabChange: (key: string) => void;
}

export function AccountNavigation({ selectedTab, onTabChange }: AccountNavigationProps) {
  const navigationItems: NavigationItem[] = [
    {
      key: "activity",
      icon: <Activity className="w-4 h-4" />,
      label: "Activity",
    },
    {
      key: "operators",
      icon: <Users className="w-4 h-4" />,
      label: "Operators",
    },
    {
      key: "policies",
      icon: <Shield className="w-4 h-4" />,
      label: "Policies",
    },
  ];

  return (
    <div className="flex items-center gap-1 mt-6 border-b border-border overflow-x-auto">
      {navigationItems.map((item) => (
        <Button
          key={item.key}
          className={`
            flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-none border-b-2
            ${
              selectedTab === item.key
                ? "border-primary text-foreground bg-content2"
                : "border-transparent text-foreground/60 hover:text-foreground hover:bg-content2"
            }
            transition-colors whitespace-nowrap
          `}
          variant="light"
          onPress={() => onTabChange(item.key)}
        >
          {item.icon}
          <span className="hidden md:inline">{item.label}</span>
          {item.badge && (
            <span className={`hidden md:inline px-2 py-0.5 text-xs rounded-full ${item.badge.className}`}>
              {item.badge.text}
            </span>
          )}
          {/* Mobile badge - only show number if exists */}
          {item.badge && item.badge.text !== "Coming Soon" && (
            <span className={`md:hidden px-2 py-0.5 text-xs rounded-full ${item.badge.className}`}>
              {item.badge.text}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
