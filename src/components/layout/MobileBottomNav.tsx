"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Receipt, Building2, CreditCard, Users } from "lucide-react";
import { Tooltip } from "@heroui/tooltip"; // Optional for icon names

// Define items specifically for the bottom nav (usually top-level)
const bottomNavItems = [
  { id: "accounts", label: "Accounts", icon: Wallet, href: "/" }, // Link to dashboard/accounts overview
  { id: "bill-pay", label: "Bill Pay", icon: Receipt, href: "/bill-pay" },
  { id: "back-office", label: "Back Office", icon: Building2, href: "/back-office" },
  { id: "card-issuance", label: "Cards", icon: CreditCard, href: "/card-issuance" },
  { id: "users", label: "Users", icon: Users, href: "/users" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Determine active state based on the start of the path
  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/"; // Exact match for root
    return pathname.startsWith(href);
  };

  return (
    // Fixed bottom bar, only visible on small screens (lg:hidden)
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-content1 border-t border-divider lg:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(item.href);
          return (
            <Tooltip key={item.id} content={item.label} placement="top" delay={300}>
              <Link
                href={item.href}
                className={`
                  inline-flex flex-col items-center justify-center px-1 pt-1 pb-1 w-full h-full
                  group transition-colors duration-150 ease-in-out
                  ${isActive ? "text-primary bg-primary/5" : "text-foreground/60 hover:bg-content2"}
                `}
                // Prevent scroll reset on navigation if desired
                // scroll={false}
              >
                <Icon
                  className={`w-5 h-5 mb-1 ${isActive ? "text-primary" : "text-foreground/60 group-hover:text-foreground/90"}`}
                />
                {/* Optional: Show label only on active or always */}
                {/* <span className={`text-xs ${isActive ? 'font-semibold' : 'hidden'}`}>{item.label}</span> */}
              </Link>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
