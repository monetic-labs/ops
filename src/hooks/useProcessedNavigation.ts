import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  mainNavigationItems,
  mobileUserMenuItems,
  sidebarUserMenuItems,
  orgMenuItems,
  type NavItem,
  type UserMenuItem,
  type OrgMenuItem,
} from "@/config/navigation";
import { useMemo } from "react";

// Type for the processed item, adding isActive and isDisabled
export interface ProcessedNavItem extends NavItem {
  isActive: boolean;
  isDisabled: boolean;
  children?: ProcessedNavItem[];
  isSkeleton?: boolean; // Add optional skeleton flag
}

export interface ProcessedUserMenuItem extends UserMenuItem {
  isActive: boolean; // Typically false for actions, but can be useful
  isDisabled: boolean;
}

export interface ProcessedOrgMenuItem extends OrgMenuItem {
  isActive: boolean;
  isDisabled: boolean;
  // OrgMenuItem specific - children are not expected here based on config
}

// Helper function to determine if a path is active
const checkIsActive = (path: string | undefined, currentPathname: string): boolean => {
  if (!path || path === "#") return false;
  if (path === "/") return currentPathname === "/"; // Exact match for root
  // Check if the current path starts with the item's path
  // Ensure it doesn't partially match (e.g., /settings active for /settings/api-keys)
  return currentPathname === path || currentPathname.startsWith(`${path}/`);
};

// Shared logic to determine disabled state
const getIsDisabled = (item: { requiresApproval?: boolean }, isFullyApproved: boolean): boolean => {
  const requiresApproval = item.requiresApproval !== false; // Default to true unless explicitly false
  return requiresApproval && !isFullyApproved;
};

// The custom hook
export const useProcessedNavigation = () => {
  const { isFullyApproved, user } = useUser();
  const pathname = usePathname();

  // Process Main Navigation Items (Recursive)
  const processedMainNavItems = useMemo((): ProcessedNavItem[] => {
    if (!pathname) return [];

    const process = (items: NavItem[]): ProcessedNavItem[] => {
      return items.map((item) => {
        const isDisabled = getIsDisabled(item, isFullyApproved);
        const processedChildren = item.children ? process(item.children) : undefined;
        const isDirectlyActive = checkIsActive(item.href, pathname);
        const isChildActive = processedChildren?.some((child) => child.isActive) ?? false;
        const isActive = isDirectlyActive || isChildActive;

        return {
          ...item,
          isActive,
          isDisabled,
          children: processedChildren,
        };
      });
    };

    return process(mainNavigationItems);
  }, [isFullyApproved, pathname]);

  // Process Mobile User Menu Items (Flat list)
  const processedMobileUserMenuItems = useMemo((): ProcessedUserMenuItem[] => {
    if (!pathname) return [];
    return mobileUserMenuItems.map((item) => ({
      ...item,
      isActive: checkIsActive(item.href, pathname),
      isDisabled: getIsDisabled(item, isFullyApproved),
    }));
  }, [isFullyApproved, pathname]);

  // Process Sidebar User Menu Items (Flat list)
  const processedSidebarUserMenuItems = useMemo((): ProcessedUserMenuItem[] => {
    if (!pathname) return [];
    return sidebarUserMenuItems.map((item) => ({
      ...item,
      isActive: checkIsActive(item.href, pathname),
      isDisabled: getIsDisabled(item, isFullyApproved),
    }));
  }, [isFullyApproved, pathname]);

  // Process Org Menu Items (Flat list)
  const processedOrgMenuItems = useMemo((): ProcessedOrgMenuItem[] => {
    if (!pathname) return [];
    const orgName = user?.merchant?.company?.name || "My Organization";

    return orgMenuItems.map((item) => {
      const finalLabel = item.id === "current-org-display" ? orgName : item.label;
      return {
        ...item,
        label: finalLabel,
        isActive: checkIsActive(item.href, pathname),
        // Org items might have their own isDisabled flag (e.g., Coming Soon)
        isDisabled: getIsDisabled(item, isFullyApproved) || item.isDisabled === true,
      };
    });
  }, [isFullyApproved, pathname, user?.merchant?.company?.name]);

  return {
    processedMainNavItems,
    processedSidebarUserMenuItems,
    processedMobileUserMenuItems,
    processedOrgMenuItems,
  };
};
