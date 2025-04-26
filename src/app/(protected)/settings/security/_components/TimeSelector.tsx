"use client";

import React from "react";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

type TimeOption = {
  label: string;
  value: string;
  description: string;
  isRecommended?: boolean;
};

interface TimeSelectorProps {
  label: string;
  options: TimeOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  isDisabled?: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  label,
  options,
  selectedValue,
  onValueChange,
  isDisabled = false,
}) => {
  return (
    <Select
      aria-label={label}
      label={`Select ${label}`}
      size="sm" // Consistent small size
      classNames={{
        trigger: "h-11", // Standard height
        value: "text-foreground",
        label: "text-foreground/60",
        base: "bg-content2",
      }}
      isDisabled={isDisabled}
      selectedKeys={selectedValue ? [selectedValue] : []}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {options.map((option) => (
        <SelectItem key={option.value} textValue={option.label}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span>{option.label}</span>
              {option.isRecommended && (
                <Chip size="sm" variant="flat" className="bg-teal-500/10 text-teal-500">
                  Recommended
                </Chip>
              )}
            </div>
            <span className="text-tiny text-foreground/40">{option.description}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
};

export default TimeSelector;
