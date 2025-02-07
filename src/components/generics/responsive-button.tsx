import React from "react";
import { Button } from "@nextui-org/button";
import { LucideIcon } from "lucide-react";

interface ResponsiveButtonProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  variant?: "bordered" | "flat" | "solid" | "ghost";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  type?: "primary" | "secondary";
  className?: string;
  isDisabled?: boolean;
}

const buttonClasses = {
  primary: "bg-primary text-primary-foreground hover:opacity-80",
  secondary: "bg-content1 hover:bg-content2 text-foreground border border-border",
};

export function ResponsiveButton({
  label,
  icon: Icon,
  onPress,
  variant = "flat",
  color = "default",
  className = "",
  type = "secondary",
  isDisabled = false,
}: ResponsiveButtonProps) {
  return (
    <Button
      className={`h-11 px-2 sm:px-6 ${className} ${buttonClasses[type]}`}
      variant={variant}
      color={color}
      onPress={onPress}
      isDisabled={isDisabled}
    >
      <span className="hidden sm:inline-flex items-center">
        {label}
        <Icon className="w-4 h-4 ml-2" />
      </span>
      <span className="inline-flex sm:hidden">
        <Icon className="w-4 h-4" />
      </span>
    </Button>
  );
}
