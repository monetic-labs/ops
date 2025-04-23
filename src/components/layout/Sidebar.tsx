"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { Skeleton } from "@heroui/skeleton";
import {
  Wallet,
  ChevronRight,
  Building,
  ChevronDown,
  Moon,
  Sun,
  MessageCircle,
  PanelLeftClose,
  PanelRightClose,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { useAccounts } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { Account } from "@/types/account";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, DropdownSection } from "@heroui/dropdown";
import { useTheme } from "@/hooks/generics/useTheme";
import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { Badge as HeroBadge } from "@heroui/badge";
import { useProcessedNavigation, type ProcessedNavItem } from "@/hooks/useProcessedNavigation";
import { UserMenu } from "./UserMenu";

// Define props for Sidebar
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// --- Skeleton Item Component (moved near top for clarity) ---
const SkeletonNavItem = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <li className={`flex items-center p-2 space-x-3 ${isCollapsed ? "justify-center" : ""}`}>
    <Skeleton className={`w-5 h-5 rounded-${isCollapsed ? "full" : "md"}`} />
    {!isCollapsed && <Skeleton className="w-32 h-4 rounded-md" />}
    {!isCollapsed && <Skeleton className="w-4 h-4 rounded-md ml-auto" />}
  </li>
);

// Accept props in the component function
export function Sidebar({ isCollapsed, toggleSidebar: originalToggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { user, isFullyApproved, isLoading: isUserLoadingGlobal, profile } = useUser();
  const { accounts, isLoadingAccounts } = useAccounts();
  const { toggleTheme, isDark } = useTheme();
  const { unreadCount } = useMessagingState();
  const {
    ui: { togglePane },
  } = useMessagingActions();

  // Get processed navigation data from the hook
  const { processedMainNavItems, processedSidebarUserMenuItems, processedOrgMenuItems } = useProcessedNavigation();

  // State for tracking sidebar transition
  const [isTransitioning, setIsTransitioning] = useState(false);

  // State for open sections (still needed for expanded view)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialOpenState: Record<string, boolean> = {};
    processedMainNavItems.forEach((item) => {
      if (item.children && item.isActive) {
        initialOpenState[item.id] = true;
      }
    });
    return initialOpenState;
  });

  // State for loading indicator when clicking a link
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Effect to clear loading state on path change
  useEffect(() => {
    setLoadingItemId(null);
  }, [pathname]);

  // Effect to open sections based on path changes from the hook
  useEffect(() => {
    setOpenSections((prevOpen) => {
      const newOpenState = { ...prevOpen };
      let changed = false;
      processedMainNavItems.forEach((item) => {
        if (item.children && item.isActive && !prevOpen[item.id]) {
          newOpenState[item.id] = true;
          changed = true;
        }
      });
      return changed ? newOpenState : prevOpen;
    });
  }, [processedMainNavItems]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Dynamic Account Items ---
  const dynamicAccountItems = useMemo((): ProcessedNavItem[] => {
    if (isLoadingAccounts) {
      return Array.from({ length: 2 }).map((_, index) => ({
        id: `skel-acc-${index}`,
        label: `Loading...`,
        icon: Wallet,
        tooltip: "Loading...",
        href: "#",
        isDisabled: true,
        isActive: false,
      }));
    }
    return accounts.map(
      (acc: Account): ProcessedNavItem => ({
        id: acc.id,
        label: acc.name,
        icon: acc.icon as LucideIcon,
        tooltip: `Select ${acc.name} account`,
        href: `/account/${acc.id}`,
        isDisabled: !isFullyApproved || acc.isDisabled || acc.isComingSoon || acc.isCreateAccount,
        isComingSoon: acc.isComingSoon,
        isCreateAccount: acc.isCreateAccount,
        isActive: pathname === `/account/${acc.id}`,
      })
    );
  }, [accounts, isLoadingAccounts, isFullyApproved, pathname]);

  // --- Final Nav Items ---
  const finalNavItems = useMemo(() => {
    return processedMainNavItems.map((item) => {
      if (item.id === "accounts-section") {
        return {
          ...item,
          children: dynamicAccountItems,
          isActive: dynamicAccountItems.some((child) => child.isActive),
          isDisabled: item.isDisabled || (dynamicAccountItems.length === 0 && !isLoadingAccounts),
          tooltip: isFullyApproved ? item.tooltip : "Complete verification to view accounts",
        };
      }
      return item;
    });
  }, [processedMainNavItems, dynamicAccountItems, isFullyApproved, isLoadingAccounts]);

  // --- Modified Toggle Function ---
  const toggleSidebar = () => {
    setIsTransitioning(true);
    originalToggleSidebar();
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // --- Refactored Render Function (using ProcessedNavItem) ---
  const renderNavItems = (items: ProcessedNavItem[], isSubmenu = false) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      const isLoading = loadingItemId === item.id;
      const finalIsDisabled = item.isDisabled || isLoading;
      const cursorClass = isLoading ? "cursor-wait" : item.isDisabled ? "cursor-not-allowed" : "";

      const isOpen = openSections[item.id] || false;
      const hasChildren = item.children && item.children.length > 0;

      // --- Collapsed State with Children: Render Dropdown ---
      if (isCollapsed && hasChildren) {
        const childItems = item.children || [];
        const disabledChildKeys = childItems.filter((child) => child.isDisabled).map((child) => child.id);

        // Placeholder Button for transition state
        const placeholderButton = (
          <Button
            isIconOnly
            variant="light"
            className="p-2 rounded-lg group w-full text-left justify-center opacity-50 cursor-wait"
            aria-label={item.label}
            isDisabled={true}
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 mx-auto">
              <IconComponent />
            </span>
          </Button>
        );

        return (
          <li key={item.id}>
            {/* Conditionally render Dropdown or Placeholder */}
            {isTransitioning ? (
              placeholderButton
            ) : (
              <Dropdown placement="right-start">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="light"
                    className={`p-2 rounded-lg group w-full text-left transition-opacity justify-center ${
                      finalIsDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content2 text-foreground/80"
                    }`}
                    aria-label={item.label}
                    isDisabled={finalIsDisabled}
                  >
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80 mx-auto">
                      <IconComponent />
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label={`${item.label} submenu`} items={childItems} disabledKeys={disabledChildKeys}>
                  {(child) => {
                    const ChildIcon = child.icon;
                    return (
                      <DropdownItem
                        key={child.id}
                        href={!child.isDisabled ? child.href : "#"}
                        startContent={<ChildIcon className="w-4 h-4" />}
                      >
                        {child.label}
                      </DropdownItem>
                    );
                  }}
                </DropdownMenu>
              </Dropdown>
            )}
          </li>
        );
      }
      // --- Expanded State with Children: Render Collapsible Button ---
      else if (!isCollapsed && hasChildren) {
        const itemContent = (
          <>
            <span className="mr-3 flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80">
              <IconComponent />
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            <div className="ml-auto flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {isLoading ? (
                <Spinner size="sm" color="primary" />
              ) : (
                <>
                  <ChevronRight
                    className={`w-4 h-4 text-foreground/60 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </>
              )}
            </div>
          </>
        );
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={isTransitioning || finalIsDisabled || !item.tooltip} // Also disable during transition
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              content={item.tooltip}
              placement="right"
            >
              <button
                type="button"
                className={`flex items-center p-2 rounded-lg group w-full text-left transition-opacity ${
                  isSubmenu ? "pl-5" : ""
                } ${finalIsDisabled ? `opacity-50 ${cursorClass}` : "hover:bg-content2 text-foreground/80"}
                  ${item.isActive && hasChildren ? "text-foreground font-semibold" : ""}
                 `}
                onClick={() => toggleSection(item.id)}
                aria-expanded={isOpen}
                disabled={finalIsDisabled}
              >
                {itemContent}
              </button>
            </Tooltip>
            {isOpen && <ul className="pt-1 pl-4 space-y-1">{renderNavItems(item.children!, true)}</ul>}
          </li>
        );
      }
      // --- Item without Children (Collapsed or Expanded) ---
      else {
        const itemContent = (
          <>
            <span
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-foreground/80 ${
                isCollapsed ? "mx-auto" : "mr-3"
              }`}
            >
              <IconComponent />
            </span>
            {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!isCollapsed && (
              <div className="ml-auto flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isLoading ? <Spinner size="sm" color="primary" /> : <></>}
              </div>
            )}
          </>
        );
        const commonClasses = `
          flex items-center p-2 rounded-lg group w-full text-left transition-opacity
          ${isSubmenu ? "pl-5" : ""}
          ${finalIsDisabled ? `opacity-50 ${cursorClass}` : "hover:bg-content2 text-foreground/80"}
          ${item.isActive && !isSubmenu && !isLoading ? "bg-content2 text-foreground font-semibold" : ""}
          ${isCollapsed ? "justify-center" : ""}
        `;

        const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          if (finalIsDisabled) {
            e.preventDefault();
            return;
          }
          if (item.href && item.href !== "#") {
            setLoadingItemId(item.id);
          }
        };
        return (
          <li key={item.id}>
            <Tooltip
              isDisabled={isTransitioning || finalIsDisabled || !item.tooltip || !isCollapsed} // Disable during transition
              classNames={{ content: "bg-content2/90 text-foreground text-xs px-2 py-1 ml-2" }}
              content={item.tooltip}
              placement="right"
            >
              <Link
                href={finalIsDisabled || !item.href || item.href === "#" ? "#" : item.href}
                className={commonClasses}
                onClick={handleItemClick}
                aria-disabled={finalIsDisabled}
                tabIndex={finalIsDisabled ? -1 : undefined}
              >
                {itemContent}
              </Link>
            </Tooltip>
          </li>
        );
      }
    });
  };

  // --- Render Org Dropdown using processedOrgMenuItems ---
  const renderOrgDropdown = () => {
    const currentOrgName = user?.merchant?.company?.name || "My Organization";
    const settingsItems = processedOrgMenuItems.filter((item) =>
      ["api-keys-setting", "team-setting"].includes(item.id)
    );
    const switchOrgItems = processedOrgMenuItems.filter((item) => item.id === "add-org");
    const disabledKeys = processedOrgMenuItems.filter((item) => item.isDisabled).map((item) => item.id);

    // Placeholder Button for transition state (mimics collapsed style)
    const placeholderTrigger = (
      <Button
        isIconOnly
        variant="light"
        className="flex items-center justify-center w-full h-[36px] p-1 rounded-lg opacity-50 cursor-wait"
        aria-label={currentOrgName}
        isDisabled={true}
      >
        <Building className="w-5 h-5 text-foreground/60" />
      </Button>
    );

    // Normal Trigger Button (used when not transitioning)
    const triggerButton = (
      <Button
        variant="light"
        className={`flex items-center h-[36px] p-1 rounded-lg hover:bg-content2 text-foreground/80 w-full ${
          isCollapsed ? "justify-center" : "justify-start px-1 text-left"
        }`}
        aria-label={currentOrgName}
      >
        <Building className="w-5 h-5 text-foreground/60 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="truncate font-semibold ml-2 mr-1 flex-grow">{currentOrgName}</span>
            <ChevronDown className="w-4 h-4 text-foreground/60 flex-shrink-0" />
          </>
        )}
      </Button>
    );

    // If transitioning, render only the placeholder
    if (isTransitioning) {
      return placeholderTrigger;
    }

    // If not transitioning, render the full Dropdown
    return (
      <Dropdown placement={isCollapsed ? "right-start" : "bottom-start"}>
        <DropdownTrigger>{triggerButton}</DropdownTrigger>
        <DropdownMenu aria-label={`Actions and settings for ${currentOrgName}`} disabledKeys={disabledKeys}>
          <DropdownSection title="Settings">
            {settingsItems.map((item) => {
              const OrgIcon = item.icon;
              return (
                <DropdownItem
                  key={item.id}
                  href={item.href}
                  startContent={<OrgIcon className="w-4 h-4" />}
                  className={item.className}
                >
                  {item.label}
                </DropdownItem>
              );
            })}
          </DropdownSection>
          <DropdownSection title="Switch Org">
            {switchOrgItems.map((item) => {
              const OrgIcon = item.icon;
              return (
                <DropdownItem
                  key={item.id}
                  startContent={<OrgIcon className="w-4 h-4" />}
                  description={item.description}
                  isDisabled={item.isDisabled}
                >
                  {item.label}
                </DropdownItem>
              );
            })}
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    );
  };

  // --- Chat Button Component ---
  const ChatButton = () => {
    const button = (
      <Button
        isIconOnly
        size="sm"
        className="flex-shrink-0 bg-transparent text-foreground/60 hover:text-foreground/90"
        variant="light"
        onPress={togglePane}
      >
        <div className="relative">
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
          )}
          <HeroBadge color="primary" content={unreadCount} isInvisible={!unreadCount} shape="circle" size="sm">
            <MessageCircle className="w-5 h-5" />
          </HeroBadge>
        </div>
      </Button>
    );
    // Render only button during transition
    return isTransitioning ? (
      button
    ) : (
      <Tooltip content="Customer Support" placement={isCollapsed ? "right" : "bottom"}>
        {button}
      </Tooltip>
    );
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-content1 border-r border-divider hidden lg:flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Section - Renders placeholder or full dropdown */}
        <div className={`border-b border-divider ${isCollapsed ? "py-4" : "px-3 py-4"}`}>{renderOrgDropdown()}</div>

        {/* Middle Section - Navigation or Skeletons */}
        <div
          className={`flex-grow h-full py-4 overflow-y-auto relative ${isCollapsed ? "overflow-x-hidden px-1" : "px-3"}`}
        >
          {isUserLoadingGlobal ? (
            <ul className="space-y-2 font-medium">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonNavItem key={`skel-${index}`} isCollapsed={isCollapsed} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-2 font-medium">{renderNavItems(finalNavItems)}</ul>
          )}
        </div>

        {/* Bottom Actions Section */}
        <div
          className={`flex items-center gap-2 py-2 border-t border-divider ${
            isCollapsed ? "flex-col px-1" : "flex-row justify-center px-3"
          }`}
        >
          <ChatButton />
          {/* Theme Toggle - Conditionally render Tooltip */}
          {isTransitioning ? (
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent text-foreground/60 hover:text-foreground/90"
              variant="light"
              onPress={toggleTheme}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          ) : (
            <Tooltip
              content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              placement={isCollapsed ? "right" : "bottom"}
            >
              <Button
                isIconOnly
                size="sm"
                className="bg-transparent text-foreground/60 hover:text-foreground/90"
                variant="light"
                onPress={toggleTheme}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </Tooltip>
          )}
          {/* Collapse Toggle - Conditionally render Tooltip */}
          {isTransitioning ? (
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent text-foreground/60 hover:text-foreground/90"
              variant="light"
              onPress={toggleSidebar}
            >
              {isCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </Button>
          ) : (
            <Tooltip
              content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              placement={isCollapsed ? "right" : "bottom"}
            >
              <Button
                isIconOnly
                size="sm"
                className="bg-transparent text-foreground/60 hover:text-foreground/90"
                variant="light"
                onPress={toggleSidebar}
              >
                {isCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </Button>
            </Tooltip>
          )}
        </div>

        {/* Bottom User Profile Section - UserMenu handles its own transition */}
        <div className={`py-4 border-t border-divider ${isCollapsed ? "px-1 flex justify-center" : "px-3"}`}>
          <UserMenu
            items={processedSidebarUserMenuItems}
            triggerType="avatar"
            placement={isCollapsed ? "right-start" : "top-start"}
            isCollapsed={isCollapsed}
            isTransitioning={isTransitioning}
          />
        </div>

        {/* Footer attribution */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-center text-xs text-foreground/30 border-t border-divider">
            <span className="flex items-center justify-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold">Monetic</span>
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
