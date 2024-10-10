import React from "react";
import { Button } from "@nextui-org/button";
import { ModalFooter } from "@nextui-org/modal";
import { Switch } from "@nextui-org/switch";

interface ActionButton {
  label: string;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}

interface ModalFooterWithSupportProps {
  actions: ActionButton[];
  onSupportClick: () => void;
  isNewCustomer?: boolean;
  onNewCustomerChange?: (value: boolean) => void;
}

export default function ModalFooterWithSupport({
  onSupportClick,
  onNewCustomerChange,
  isNewCustomer,
  actions,
}: ModalFooterWithSupportProps) {
  return (
    <>
      <ModalFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        <Button
          variant="light"
          className="text-notpurple-500 w-2/3 sm:w-auto mx-auto sm:mx-0 order-2 sm:order-none"
          onPress={onSupportClick}
        >
          Support
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-none">
          {onNewCustomerChange && isNewCustomer !== undefined && (
            <div className="flex flex-row items-center gap-2">
              <span className="items-center">New Contact</span>
              <Switch
                defaultSelected
                aria-label="New Customer"
                isSelected={isNewCustomer}
                onValueChange={onNewCustomerChange}
              />
            </div>
          )}
          {actions.map((action, index) => (
            <Button
              key={index}
              className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto ${action.className || ""}`}
              onPress={action.onClick}
              isLoading={action.isLoading}
              isDisabled={action.isDisabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </ModalFooter>
    </>
  );
}
