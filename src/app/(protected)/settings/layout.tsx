"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, Shield, User, Users, CreditCard } from "lucide-react";
import { Suspense } from "react";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";

interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}

const settingsSections: SettingsSection[] = [
  {
    title: "Personal",
    items: [
      {
        id: "profile",
        label: "Profile",
        href: "/settings",
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
        icon: <CreditCard className="w-4 h-4" />,
      },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveSectionKey = () => {
    for (const section of settingsSections) {
      if (section.items.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))) {
        return section.title;
      }
    }
    return settingsSections[0]?.title;
  };

  const activeSectionKey = getActiveSectionKey();

  const handleTabSelection = (key: React.Key) => {
    const selectedSection = settingsSections.find((section) => section.title === key);
    if (selectedSection?.items[0]?.href) {
      router.push(selectedSection.items[0].href);
    }
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-[180px_1fr] lg:gap-10">
      <aside className="hidden lg:block sticky top-0 h-fit">
        <nav className="space-y-4">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase text-foreground/50 tracking-wider">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const linkClasses = `
                    group flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-content2 hover:text-foreground
                    ${isActive ? "bg-content2 font-semibold text-foreground" : "transparent"}
                  `;
                  return (
                    <Link key={item.id} href={item.href} className={linkClasses.trim()}>
                      {item.icon && (
                        <span className="mr-2 text-foreground/60 group-hover:text-foreground/80">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col min-w-0">
        <div className="block lg:hidden mb-6 border-b border-divider">
          <Tabs
            aria-label="Settings sections"
            selectedKey={activeSectionKey}
            onSelectionChange={handleTabSelection}
            variant="underlined"
            className="justify-start"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-2 h-10",
            }}
          >
            {settingsSections.map((section) => (
              <Tab key={section.title} title={section.title} />
            ))}
          </Tabs>
        </div>
        <main className="flex-1 overflow-x-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full w-full">
                <Spinner size="lg" color="primary" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
