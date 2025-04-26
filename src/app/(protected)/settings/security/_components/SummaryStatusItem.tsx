"use client";

import React from "react";
import { Chip } from "@heroui/chip";

interface SummaryStatusItemProps {
  label: string;
  value: string | number;
  description: string;
  chipColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  children?: React.ReactNode;
}

const SummaryStatusItem: React.FC<SummaryStatusItemProps> = ({
  label,
  value,
  description,
  chipColor = "default",
  children,
}) => {
  return (
    <div className="p-3 bg-content2 rounded-lg border border-content3">
      <div className="flex items-center mb-2">
        <span className="text-sm font-medium mr-auto">{label}</span>
        <Chip color={chipColor} variant="flat" size="sm">
          {value}
        </Chip>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-foreground-600 dark:text-foreground-400">{description}</p>
        {children}
      </div>
    </div>
  );
};

export default SummaryStatusItem;
