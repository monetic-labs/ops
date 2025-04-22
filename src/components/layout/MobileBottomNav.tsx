"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Receipt, Building2, CreditCard, Users } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@heroui/skeleton";

// Define items specifically for the bottom nav (usually top-level)
const bottomNavItems = [
  { id: "accounts", label: "Accounts", icon: Wallet, href: "/" }, // Link to dashboard/accounts overview
  { id: "bill-pay", label: "Bill Pay", icon: Receipt, href: "/bill-pay" },
  { id: "back-office", label: "Back Office", icon: Building2, href: "/back-office" },
  { id: "card-issuance", label: "Cards", icon: CreditCard, href: "/card-issuance" },
  { id: "users", label: "Users", icon: Users, href: "/users/members" }, // Direct to members page
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isFullyApproved, isLoading: isUserLoadingGlobal } = useUser();

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/account/"); // Highlight Accounts for root and account pages
    return pathname.startsWith(href);
  };

  // Removed filtering - iterate directly over all items
  const gridCols = bottomNavItems.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-content1 border-t border-divider lg:hidden">
      <div
        className="grid h-full max-w-lg mx-auto font-medium items-center"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {isUserLoadingGlobal
          ? // Render Skeletons during global load
            bottomNavItems.map((item) => (
              <div key={`skel-mob-${item.id}`} className="flex justify-center items-center h-full">
                <Skeleton className="w-6 h-6 rounded-md" />
              </div>
            ))
          : // Render actual items once loaded
            bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);
              const isDisabled = !isFullyApproved;

              return (
                <Link
                  key={item.id}
                  href={isDisabled ? "#" : item.href}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    }
                  }}
                  className={`
                  inline-flex flex-col items-center justify-center px-1 pt-1 pb-1 h-full
                  group transition-colors duration-150 ease-in-out
                  ${isActive && !isDisabled ? "text-primary bg-primary/5" : "text-foreground/60"} 
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2"}
                `}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                >
                  <Icon
                    className={`w-5 h-5 mb-1 ${
                      isActive && !isDisabled
                        ? "text-primary"
                        : isDisabled
                          ? "text-foreground/30"
                          : "text-foreground/60 group-hover:text-foreground/90"
                    }`}
                  />
                </Link>
              );
            })}
      </div>
    </nav>
  );
}
