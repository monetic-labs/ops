"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@heroui/skeleton";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useProcessedNavigation, type ProcessedNavItem } from "@/hooks/useProcessedNavigation";
import { UserMenu } from "./UserMenu";

export function MobileBottomNav() {
  const { user, logout, isFullyApproved, isLoading: isUserLoadingGlobal } = useUser();
  const { processedMainNavItems, processedMobileUserMenuItems } = useProcessedNavigation();

  const mobileBarItems = processedMainNavItems.filter((item) => item.id !== "back-office");
  const backOfficeItem = processedMainNavItems.find((item) => item.id === "back-office");

  const gridCols = mobileBarItems.length + (backOfficeItem ? 1 : 0) + 1;

  const renderNavItem = (item: ProcessedNavItem) => {
    const Icon = item.icon as LucideIcon;
    const finalIsDisabled = item.isDisabled;
    const finalIsActive = item.isActive;

    if (item.id === "back-office" && item.children && item.children.length > 0) {
      const childItems = item.children;
      const disabledChildKeys = childItems.filter((child) => child.isDisabled).map((child) => child.id);
      return (
        <div key={item.id} className="flex justify-center items-center h-full">
          <Dropdown placement="top">
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                className={`text-foreground/60 hover:bg-content2 group h-full w-full flex flex-col items-center justify-center p-1 rounded-none ${
                  finalIsActive && !finalIsDisabled ? "text-primary bg-primary/5" : ""
                } ${finalIsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                isDisabled={finalIsDisabled}
                aria-label={item.label}
              >
                <Icon
                  className={`w-5 h-5 mb-1 ${
                    finalIsActive && !finalIsDisabled
                      ? "text-primary"
                      : finalIsDisabled
                        ? "text-foreground/30"
                        : "text-foreground/60 group-hover:text-foreground/90"
                  }`}
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={`${item.label} Actions`} items={childItems} disabledKeys={disabledChildKeys}>
              {(child) => {
                const SubIcon = child.icon as LucideIcon;
                return (
                  <DropdownItem
                    key={child.id}
                    href={!child.isDisabled ? child.href : "#"}
                    startContent={<SubIcon className="w-4 h-4" />}
                  >
                    {child.label}
                  </DropdownItem>
                );
              }}
            </DropdownMenu>
          </Dropdown>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={finalIsDisabled || !item.href || item.href === "#" ? "#" : item.href}
        onClick={(e) => {
          if (finalIsDisabled) {
            e.preventDefault();
          }
        }}
        className={`
          inline-flex flex-col items-center justify-center px-1 pt-1 pb-1 h-full
          group transition-colors duration-150 ease-in-out
          ${finalIsActive && !finalIsDisabled ? "text-primary bg-primary/5" : "text-foreground/60"}
          ${finalIsDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2"}
        `}
        aria-disabled={finalIsDisabled}
        tabIndex={finalIsDisabled ? -1 : undefined}
      >
        <Icon
          className={`w-5 h-5 mb-1 ${
            finalIsActive && !finalIsDisabled
              ? "text-primary"
              : finalIsDisabled
                ? "text-foreground/30"
                : "text-foreground/60 group-hover:text-foreground/90"
          }`}
        />
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-content1 border-t border-divider lg:hidden">
      <div
        className="grid h-full max-w-lg mx-auto font-medium items-center"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {isUserLoadingGlobal ? (
          Array.from({ length: gridCols }).map((_, index) => (
            <div key={`skel-mob-${index}`} className="flex justify-center items-center h-full">
              <Skeleton className="w-6 h-6 rounded-md" />
            </div>
          ))
        ) : (
          <>
            {mobileBarItems.map(renderNavItem)}
            {backOfficeItem && renderNavItem(backOfficeItem)}

            <div className="flex justify-center items-center h-full">
              <UserMenu items={processedMobileUserMenuItems} triggerType="settingsIcon" placement="top-end" />
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
