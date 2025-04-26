"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/hooks/generics/useTheme";
import { useMessagingState } from "@/libs/messaging/store";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown";
import type { Placement } from "@floating-ui/react";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Settings, Sun, Moon } from "lucide-react";
import type { ProcessedUserMenuItem } from "@/hooks/useProcessedNavigation";
import { useShortcuts } from "@/components/generics/shortcuts-provider";

interface UserMenuProps {
  items: ProcessedUserMenuItem[];
  triggerType: "avatar" | "settingsIcon";
  placement: Placement;
  isCollapsed?: boolean; // Relevant only for avatar trigger
  triggerClassName?: string; // Allow custom styling for the trigger button
  menuDisabledKeys?: string[]; // Pass externally calculated disabled keys if needed
  isTransitioning?: boolean; // Added prop to control menu rendering
}

export function UserMenu({
  items,
  triggerType,
  placement,
  isCollapsed = false,
  triggerClassName = "",
  menuDisabledKeys = [],
  isTransitioning = false, // Default to false
}: UserMenuProps) {
  const { user, logout, profile } = useUser();
  const { toggleTheme, isDark } = useTheme();
  const { toggleChat } = useShortcuts();
  const { unreadCount } = useMessagingState();

  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoadingAction("logout");
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoadingAction(null);
    }
    // Redirect handled by context, loading state cleared by path change likely
  };

  const handleAction = (action: ProcessedUserMenuItem["action"]) => {
    switch (action) {
      case "toggleTheme":
        toggleTheme();
        break;
      case "toggleChat":
        toggleChat();
        break;
      case "logout":
        handleLogout();
        break;
      default:
        console.warn("Unhandled action:", action);
    }
  };

  const initials = // Calculate initials for avatar trigger
    user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : undefined;

  // --- Group items logically for rendering sections ---
  // This could also be done in the hook later if preferred
  const toolItems = items.filter((i) => ["chat", "theme"].includes(i.id));
  const personalItems = items.filter((i) => ["profile", "security"].includes(i.id));
  const orgItems = items.filter((i) => ["team-members", "api-keys", "card-settlement"].includes(i.id));
  const actionItems = items.filter((i) => ["logout"].includes(i.id));

  // Combine external and internal disabled keys
  const allDisabledKeys = [
    ...menuDisabledKeys,
    ...(isLoadingAction ? items.map((i) => i.id) : []), // Disable all if an action is loading
    ...items.filter((i) => i.isDisabled).map((i) => i.id), // Add items disabled by the hook
  ];

  const renderTrigger = () => {
    if (triggerType === "avatar") {
      return (
        <Button
          variant="light"
          className={`w-full justify-start px-2 text-foreground/80 hover:bg-content2 disabled:opacity-50 disabled:cursor-wait ${
            isCollapsed ? "justify-center !px-0" : ""
          } ${triggerClassName}`}
          disabled={isLoadingAction === "logout"}
        >
          <Avatar
            isBordered
            className="transition-transform flex-shrink-0"
            classNames={{ base: "bg-primary/10", icon: "text-primary" }}
            name={initials}
            showFallback={!profile?.profileImage}
            size="sm"
            src={profile?.profileImage || undefined}
          />
          {!isCollapsed && (
            <div className="flex flex-col flex-grow text-left ml-2 min-w-0">
              <span className="truncate">{user?.firstName || "User"}</span>
              <span className="truncate text-xs text-foreground/60">{user?.email}</span>
            </div>
          )}
          {!isCollapsed && isLoadingAction === "logout" && <Spinner size="sm" className="ml-auto" />}
        </Button>
      );
    }

    // triggerType === 'settingsIcon'
    return (
      <Button
        isIconOnly
        variant="light"
        className={`text-foreground/60 hover:bg-content2 group h-full w-full flex flex-col items-center justify-center p-1 rounded-none ${triggerClassName}`}
        disabled={isLoadingAction === "logout"}
      >
        <Settings className={`w-5 h-5 mb-1 text-foreground/60 group-hover:text-foreground/90`} />
        {/* Add active state styling based on pathname if needed later via className */}
      </Button>
    );
  };

  const renderDropdownItem = (item: ProcessedUserMenuItem) => {
    const content = item.type === "theme" ? (isDark ? "Light Mode" : "Dark Mode") : item.label;
    const icon =
      item.type === "theme" ? (
        isDark ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )
      ) : (
        <item.icon className="w-4 h-4" />
      );
    const startContent =
      item.id === "chat" ? (
        <div className="relative">
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-primary opacity-75" />
          )}
          {icon}
        </div>
      ) : (
        icon
      );

    if (item.href) {
      return (
        <DropdownItem key={item.id} href={item.href} startContent={startContent}>
          {content}
        </DropdownItem>
      );
    }

    return (
      <DropdownItem
        key={item.id}
        color={item.isDanger ? "danger" : undefined}
        className={item.isDanger ? "text-danger" : ""}
        startContent={startContent}
        onPress={() => item.action && handleAction(item.action)}
        description={isLoadingAction === item.action ? <Spinner size="sm" /> : undefined}
      >
        {content}
      </DropdownItem>
    );
  };

  return (
    <>
      <Dropdown placement={placement}>
        <DropdownTrigger>{renderTrigger()}</DropdownTrigger>
        {/* Conditionally render DropdownMenu based on transition state */}
        {!isTransitioning && (
          <DropdownMenu
            aria-label="User actions and settings"
            disabledKeys={allDisabledKeys}
            itemClasses={{ base: "pl-3 pr-3" }}
          >
            {toolItems.length > 0 ? (
              <DropdownSection title="Tools">{toolItems.map(renderDropdownItem)}</DropdownSection>
            ) : null}
            {personalItems.length > 0 ? (
              <DropdownSection title="Personal">{personalItems.map(renderDropdownItem)}</DropdownSection>
            ) : null}
            {orgItems.length > 0 ? (
              <DropdownSection title="Organization">{orgItems.map(renderDropdownItem)}</DropdownSection>
            ) : null}
            {actionItems.length > 0 ? (
              <DropdownSection title="Actions">{actionItems.map(renderDropdownItem)}</DropdownSection>
            ) : null}
          </DropdownMenu>
        )}
      </Dropdown>
    </>
  );
}
