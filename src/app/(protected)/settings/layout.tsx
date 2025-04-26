"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@heroui/spinner";

import { settingsSections } from "@/config/settingsNavigation";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-[180px_1fr] lg:gap-6">
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
      <main className="flex-1 w-full overflow-x-auto">
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
  );
}
