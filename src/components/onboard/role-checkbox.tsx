"use client";

import { Checkbox } from "@nextui-org/checkbox";

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export const RoleCheckbox = ({
  role,
  description,
  examples,
  isSelected,
  onValueChange,
  hasError,
  isDisabled,
}: {
  role: string;
  description: string;
  examples: string;
  isSelected: boolean;
  onValueChange: (selected: boolean) => void;
  hasError?: boolean;
  isDisabled?: boolean;
}) => {
  return (
    <Checkbox
      aria-label={role}
      classNames={{
        base: cn(
          "inline-flex w-full",
          "hover:bg-content2 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2",
          hasError ? "border-red-500" : "border-default-200",
          isDisabled ? "opacity-70" : ""
        ),
        label: "w-full",
      }}
      isDisabled={isDisabled}
      isSelected={isSelected}
      onValueChange={onValueChange}
    >
      <div className="w-full flex flex-col gap-1">
        <span className="text-medium font-semibold">
          {role
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </span>
        <span className="text-small text-default-500">{description}</span>
        <span className="text-tiny text-default-400">{examples}</span>
      </div>
    </Checkbox>
  );
};
