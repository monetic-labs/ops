"use client";

import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { Shield, InfoIcon, AlertTriangle } from "lucide-react";
import { Select, SelectItem } from "@nextui-org/select";

type RecoveryHeaderProps = {
  configuredCount: number;
  threshold: number;
  onThresholdChange: (value: number) => void;
};

export const RecoveryHeader = ({ configuredCount, threshold, onThresholdChange }: RecoveryHeaderProps) => {
  const thresholdOptions = Array.from({ length: configuredCount || 1 }, (_, i) => i + 1);
  const totalOptions = configuredCount || 1;

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
        <Select
          label="Required for Recovery"
          defaultSelectedKeys={[threshold.toString()]}
          selectedKeys={[threshold.toString()]}
          size="sm"
          onChange={(e) => {
            const selectedValue = Number(e.target.value);
            onThresholdChange(selectedValue);
          }}
          renderValue={(items) => {
            const selected = items[0];
            return `${selected.key} of ${totalOptions} required`;
          }}
        >
          {thresholdOptions.map((value) => (
            <SelectItem key={value} value={value}>
              {value} of {totalOptions} required
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
};
