import React from "react";
import { Button } from "@nextui-org/button";

interface ActionButton {
  label: string;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}

interface CardFooterWithActionsProps {
  onSupportClick?: () => void;
  actions: ActionButton[];
}

export default function CardFooterWithActions({ onSupportClick, actions }: CardFooterWithActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-4">
      {onSupportClick && (
        <Button
          className="text-notpurple-500 w-2/3 sm:w-auto mx-auto sm:mx-0 order-2 sm:order-none"
          variant="light"
          onPress={onSupportClick}
        >
          Support
        </Button>
      )}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-none">
        {actions.map((action, index) => (
          <Button
            key={index}
            className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto ${action.className || ""}`}
            isDisabled={action.isDisabled}
            isLoading={action.isLoading}
            onPress={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
