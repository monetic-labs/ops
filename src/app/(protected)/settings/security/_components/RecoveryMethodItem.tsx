"use client";

import React from "react";
import { Chip } from "@heroui/chip";
import { LucideIcon, ChevronDown } from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Switch } from "@heroui/switch";

// Import MoneticRecovery type for the generic component approach
type MoneticRecoveryProps = {
  isMoneticRecoveryEnabled: boolean;
  handleToggleMonetic: () => void;
};

export interface RecoveryMethodItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isActive?: boolean;
  isComingSoon?: boolean;
  statusLabel?: string;
  chipColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  children?: React.ReactNode;
  defaultOpen?: boolean;
  disableCollapse?: boolean;
  // Add props for integrated MoneticRecovery
  isMoneticRecovery?: boolean;
  isMoneticRecoveryEnabled?: boolean;
  handleToggleMonetic?: () => void;
  isPendingToggle?: boolean;
  disableToggle?: boolean;
  onManualRecoveryRequest?: () => void;
}

const RecoveryMethodItem: React.FC<RecoveryMethodItemProps> = ({
  title,
  description,
  icon: Icon,
  isActive = false,
  isComingSoon = false,
  statusLabel,
  chipColor: chipColorProp,
  children,
  defaultOpen = false,
  disableCollapse = false,
  // Monetic specific props
  isMoneticRecovery = false,
  isMoneticRecoveryEnabled = false,
  handleToggleMonetic,
  isPendingToggle = false,
  disableToggle = false,
  onManualRecoveryRequest,
}) => {
  // Determine chip display - coming soon takes precedence over active status
  const determinedChipColor = chipColorProp ?? (isComingSoon ? "default" : isActive ? "success" : "default");
  const chipLabel = isPendingToggle
    ? "Pending..."
    : isComingSoon
      ? "Coming Soon"
      : statusLabel || (isActive ? "Active" : "Not Set");

  // Generate the Monetic Recovery content if this is a Monetic Recovery item
  const generateMoneticContent = () => {
    if (!isMoneticRecovery || !handleToggleMonetic) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-foreground-700">
            Enable Monetic to assist in account recovery if other methods fail, acting as a guardian.
          </span>
          <Switch
            isSelected={isMoneticRecoveryEnabled}
            onValueChange={handleToggleMonetic}
            aria-label="Toggle Monetic Recovery"
            size="md"
            isDisabled={isPendingToggle || disableToggle}
          />
        </div>

        {/* Manual Recovery Assistance Section - only if Monetic Recovery is enabled */}
        {isMoneticRecoveryEnabled && onManualRecoveryRequest && (
          <div className="pt-4 mt-4 border-warning space-y-3 bg-warning/10 p-4 rounded-md">
            <h4 className="text-sm font-medium text-warning-700">Lost All Access Methods?</h4>
            <p className="text-xs text-warning-600">
              If you've lost all passkeys and Monetic Recovery is your only option, you can request manual assistance.
              This is an intensive process reserved for emergencies.
            </p>
            <button
              onClick={onManualRecoveryRequest}
              className="text-xs text-danger hover:text-danger-600 font-medium disabled:opacity-50"
              disabled={isPendingToggle}
            >
              Request Manual Recovery Assistance &rarr;
            </button>
          </div>
        )}
      </div>
    );
  };

  // Decide if we should show content
  // Either we have children passed in, or this is a Monetic Recovery item
  const hasContent = React.Children.count(children) > 0 || isMoneticRecovery;

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 flex items-center justify-center ${
            isComingSoon ? "bg-foreground/10" : "bg-primary/10"
          } rounded-md`}
        >
          <Icon className={`w-4 h-4 ${isComingSoon ? "text-foreground/60" : "text-primary"}`} />
        </div>
        <div>
          <span className="font-medium">{title}</span>
          <div className="text-xs text-foreground-500 mt-0.5">{description}</div>
        </div>
      </div>
      <Chip
        size="sm"
        variant="flat"
        className={isComingSoon ? "bg-content3 text-foreground/60" : undefined}
        color={determinedChipColor}
      >
        {chipLabel}
      </Chip>
    </div>
  );

  // If we're not making it collapsible or there's no content, render a simpler version
  if (disableCollapse || !hasContent) {
    return (
      <div className="w-full border border-divider rounded-lg overflow-hidden mb-3 last:mb-0">
        <div className="p-4">{headerContent}</div>
        {/* Render children even if not collapsible, if they exist */}
        {children && <div className="p-4 border-t border-divider">{children}</div>}
      </div>
    );
  }

  // Content to render inside the accordion
  const accordionContent = isMoneticRecovery ? generateMoneticContent() : children;

  // Otherwise, use the Accordion component for collapsible content
  return (
    <Accordion
      defaultExpandedKeys={defaultOpen ? ["item-1"] : []}
      showDivider={false}
      className={`w-full mb-3 last:mb-0 ${isComingSoon ? "opacity-70" : ""}`}
      itemClasses={{
        base: "border border-divider rounded-lg mb-0 overflow-hidden",
        title: "py-0 px-0",
        trigger: "p-0",
        indicator: "text-foreground/50",
        content: "p-4",
      }}
    >
      <AccordionItem
        key="item-1"
        aria-label={`${title} settings`}
        classNames={{
          title: "text-medium",
          trigger: "px-4 py-3 data-[hover=true]:bg-content2/40",
          indicator: "right-4", // Fix for arrow positioning
        }}
        indicator={<ChevronDown className="text-foreground-500" />}
        title={headerContent}
      >
        {accordionContent}
      </AccordionItem>
    </Accordion>
  );
};

export default RecoveryMethodItem;
