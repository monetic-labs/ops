"use client";

import { Input } from "@nextui-org/input";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { schema } from "@/validations/onboard/schemas";

// Helper function to check if a field is optional in the schema
const isFieldOptional = (fieldPath: string) => {
  try {
    const pathParts = fieldPath.split(".");
    let currentSchema: any = schema;

    // Navigate through nested schemas
    for (const part of pathParts) {
      if (currentSchema.shape) {
        currentSchema = currentSchema.shape[part];
      } else if (Array.isArray(currentSchema)) {
        currentSchema = currentSchema[parseInt(part)];
      }
    }

    // Check if the field is optional
    return currentSchema instanceof z.ZodOptional;
  } catch (e) {
    // If we can't determine from schema, default to required
    return false;
  }
};

export const FormField = ({
  name,
  label,
  isOptional,
  value,
  onChange,
  formatValue,
  ...props
}: {
  name: string;
  label: string;
  isOptional?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatValue?: (value: string) => string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "label">) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  // Handle nested field errors (e.g., users.0.email)
  const getNestedError = (path: string) => {
    return path.split(".").reduce((acc: any, part) => acc?.[part], errors);
  };

  const error = getNestedError(name);
  const errorMessage = error?.message;

  // Determine if field is required based on schema or explicit isOptional prop
  const isRequired = !isOptional && !isFieldOptional(name);

  // Handle value formatting if provided
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (formatValue) {
      const formattedValue = formatValue(newValue);

      setValue(name, formattedValue);
    } else if (onChange) {
      onChange(e);
    }
  };

  // If value and onChange are provided, use them (controlled input)
  // Otherwise, use register (uncontrolled input)
  const inputProps =
    value !== undefined && onChange
      ? { value, onChange: handleChange }
      : {
          ...register(name),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            register(name).onChange(e);
            if (formatValue) {
              const formattedValue = formatValue(e.target.value);

              setValue(name, formattedValue);
            }
          },
        };

  return (
    <Input
      {...props}
      {...inputProps}
      classNames={{
        ...props.classNames,
        input: `${props.classNames?.input || ""} ${error ? "border-red-500" : ""}`,
      }}
      errorMessage={errorMessage?.replace(/'/g, "&apos;")}
      isInvalid={!!error}
      isRequired={isRequired}
      label={
        <>
          {label}
          {!isRequired && <span className="text-xs text-default-400 ml-1">(Optional)</span>}
        </>
      }
    />
  );
};
