"use client";

import React from "react";
import { Select, SelectItem } from "@heroui/select";
import { Tooltip } from "@heroui/tooltip";
import { InfoIcon, ShieldAlert } from "lucide-react";

interface RecoveryThresholdSelectorProps {
  configuredCount: number;
  threshold: number;
  onThresholdChange: (value: number) => void;
  isDisabled?: boolean;
  isCompact?: boolean;
  className?: string;
}

const RecoveryThresholdSelector: React.FC<RecoveryThresholdSelectorProps> = ({
  configuredCount,
  threshold,
  onThresholdChange,
  isDisabled = false,
  isCompact = false,
  className = "",
}) => {
  // With only Monetic, the threshold must be 1.
  const effectiveThreshold = configuredCount === 1 ? 1 : threshold;
  const isEffectivelyDisabled = isDisabled || configuredCount < 2; // Disable if only 0 or 1 option
  const totalOptions = Math.max(configuredCount, 1); // Ensure at least 1 for display
  const thresholdOptions = Array.from({ length: totalOptions }, (_, i) => i + 1);

  // Provide more detailed security context based on threshold and total options
  const getSecurityContext = () => {
    if (configuredCount === 0) {
      return "No recovery methods have been set up yet.";
    }

    if (configuredCount === 1) {
      return "With only one recovery method, this is the only option available.";
    }

    if (effectiveThreshold === 1) {
      return "⚠️ Low Security: Any single method can recover your account. Adding more methods increases compromise risk.";
    }

    if (effectiveThreshold === configuredCount) {
      return "🔒 Maximum Security: All configured methods are required for recovery.";
    }

    if (effectiveThreshold > configuredCount / 2) {
      return "🔒 High Security: Majority of methods required for recovery.";
    }

    return "🔐 Medium Security: Multiple methods required for recovery.";
  };

  const tooltipContent = (
    <div className="p-3 max-w-xs space-y-2">
      <p className="text-sm font-medium">Recovery Threshold</p>
      {configuredCount === 0 ? (
        <p className="text-xs">Enable at least one recovery method to set a threshold.</p>
      ) : configuredCount === 1 ? (
        <p className="text-xs">With only one recovery method, the threshold must be 1.</p>
      ) : (
        <>
          <p className="text-xs">Choose how many methods are needed to recover your account.</p>
          <p className="text-xs mt-1">{getSecurityContext()}</p>
        </>
      )}
    </div>
  );

  return (
    <div className={`${isCompact ? "w-36" : "w-48"} ${className}`}>
      <Tooltip content={tooltipContent} placement="top-end" showArrow={true}>
        <div>
          <Select
            aria-label="Required recovery methods threshold"
            label={isCompact ? undefined : "Methods Required for Recovery"}
            size="sm"
            selectedKeys={[effectiveThreshold.toString()]}
            isDisabled={isEffectivelyDisabled}
            renderValue={(items) => {
              const selected = items[0];
              return (
                <div className="flex items-center gap-2">
                  <span>
                    {selected?.key ?? effectiveThreshold} of {totalOptions} {isCompact ? "" : "required"}
                  </span>
                  <InfoIcon className="w-4 h-4 text-foreground/60" />
                </div>
              );
            }}
            onChange={(e) => {
              const selectedValue = Number(e.target.value);
              if (!isNaN(selectedValue)) {
                onThresholdChange(selectedValue);
              }
            }}
            classNames={
              isCompact
                ? {
                    label: "text-xs",
                    trigger: "min-h-unit-8 h-unit-8 py-0",
                    value: "text-xs",
                  }
                : undefined
            }
          >
            {thresholdOptions.map((value) => (
              <SelectItem
                key={value}
                textValue={`${value} of ${totalOptions} required`}
                startContent={
                  value === 1 && totalOptions > 1 ? <ShieldAlert className="text-warning w-4 h-4 mr-1" /> : null
                }
              >
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span>
                      {value} of {totalOptions} {isCompact ? "" : "required"}
                    </span>
                  </div>
                  {!isCompact && (
                    <span className="text-tiny text-foreground/50">
                      {value === 1 && totalOptions > 1
                        ? "Any single method can recover (lowest security)"
                        : value === totalOptions
                          ? "All methods required (highest security)"
                          : `${value} methods needed to recover`}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </Select>
        </div>
      </Tooltip>
    </div>
  );
};

export default RecoveryThresholdSelector;
