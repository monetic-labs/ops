"use client";

import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { Shield, InfoIcon } from "lucide-react";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect } from "react";

type RecoveryHeaderProps = {
  configuredCount: number;
  threshold: number;
  onThresholdChange: (value: number) => void;
};

export const RecoveryHeader = ({ configuredCount, threshold, onThresholdChange }: RecoveryHeaderProps) => {
  const thresholdOptions = Array.from({ length: configuredCount || 1 }, (_, i) => i + 1);
  const totalOptions = configuredCount || 1;

  // Update threshold when configured count changes
  useEffect(() => {
    if (configuredCount >= 3) {
      // With 3 or more options, default/limit to 2
      if (threshold > 2) {
        onThresholdChange(2);
      }
    } else if (configuredCount === 2) {
      // With exactly 2 options, require both
      onThresholdChange(2);
    } else if (configuredCount === 1) {
      // With 1 option, require it
      onThresholdChange(1);
    }
  }, [configuredCount, threshold, onThresholdChange]);

  // Determine if the select should be disabled
  const isSelectDisabled = configuredCount <= 2;

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-teal-500" />
        </div>
        <div>
          <h4 className="font-medium">Recovery Options</h4>
          <p className="text-sm text-foreground/60">Configure multiple recovery options for enhanced security</p>
        </div>
      </div>
      <div className="w-44">
        <Tooltip
          content={
            <div className="p-2 max-w-xs">
              <p className="text-sm">
                {configuredCount >= 3
                  ? "With 3 options, we recommend requiring 2 for recovery to balance security and convenience."
                  : configuredCount === 2
                    ? "With 2 options, both are required for recovery to maintain security."
                    : configuredCount === 1
                      ? "With 1 option, it is required for recovery. This is not recommended."
                      : "Add recovery options to secure your account."}
              </p>
            </div>
          }
        >
          <div>
            <Select
              label="Required for Recovery"
              defaultSelectedKeys={[threshold.toString()]}
              selectedKeys={[threshold.toString()]}
              size="sm"
              isDisabled={isSelectDisabled}
              onChange={(e) => {
                const selectedValue = Number(e.target.value);
                onThresholdChange(selectedValue);
              }}
              renderValue={(items) => {
                const selected = items[0];
                return (
                  <div className="flex items-center gap-2">
                    <span>
                      {selected.key} of {totalOptions} required
                    </span>
                    <InfoIcon className="w-4 h-4 text-foreground/60" />
                  </div>
                );
              }}
            >
              {thresholdOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  <div className="flex flex-col gap-1">
                    <span>
                      {value} of {totalOptions} required
                    </span>
                    <span className="text-xs text-foreground/60">
                      {value === totalOptions
                        ? "All options required for recovery"
                        : value === 2 && totalOptions >= 3
                          ? "Recommended for balanced security"
                          : "Less secure configuration"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
