"use client";

import React from "react";
import { LucideIcon, AlertCircle, CheckCircle, Info } from "lucide-react";

type StatusType = "warning" | "success" | "info" | "danger";

interface StatusAlertProps {
  type: StatusType;
  message: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const StatusAlert: React.FC<StatusAlertProps> = ({ type, message, icon: CustomIcon, className = "" }) => {
  // Default icons by type
  const getDefaultIcon = (): LucideIcon => {
    switch (type) {
      case "warning":
        return AlertCircle;
      case "success":
        return CheckCircle;
      case "danger":
        return AlertCircle;
      case "info":
      default:
        return Info;
    }
  };

  const Icon = CustomIcon || getDefaultIcon();

  // Background and border classes by type
  const getClasses = (): string => {
    switch (type) {
      case "warning":
        return "border-warning-200 bg-warning-50 dark:bg-warning/10 dark:border-warning/30 text-warning-600 dark:text-warning";
      case "success":
        return "border-success/30 bg-success/10 text-success dark:bg-success/10 dark:border-success/30 dark:text-success";
      case "danger":
        return "border-danger-200 bg-danger-50 dark:bg-danger/10 dark:border-danger/30 text-danger-600 dark:text-danger";
      case "info":
      default:
        return "border-primary-200 bg-primary-50 dark:bg-primary/10 dark:border-primary/30 text-primary-600 dark:text-primary";
    }
  };

  return (
    <div className={`flex items-center gap-2 p-3 border rounded-lg text-sm font-medium ${getClasses()} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default StatusAlert;
