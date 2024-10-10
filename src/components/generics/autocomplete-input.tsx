import React, { useState } from "react";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Tooltip } from "@nextui-org/tooltip";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface AutocompleteInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
  label: string;
  placeholder?: string;
  items: { label: string; value: string }[];
  about?: string;
  isReadOnly?: boolean;
  filterItems?: (items: { label: string; value: string }[]) => { label: string; value: string }[];
}

export const AutocompleteInput = <T extends FieldValues>({
  name,
  control,
  errorMessage,
  helperText,
  label,
  placeholder,
  items,
  about,
  isReadOnly,
  filterItems,
}: AutocompleteInputProps<T>) => {

  const filteredItems = filterItems ? filterItems(items) : items;

  return (
    <div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Tooltip content={about}>
            <Autocomplete
              {...field}
              isReadOnly={isReadOnly}
              label={label}
              placeholder={placeholder}
              defaultItems={filteredItems}
              onSelectionChange={(value) => field.onChange(value)}
              selectedKey={field.value}
              errorMessage={errorMessage}
              isInvalid={!!errorMessage}
            >
              {(item) => (
                <AutocompleteItem key={item.value} value={item.value}>
                  {item.label}
                </AutocompleteItem>
              )}
            </Autocomplete>
          </Tooltip>
        )}
      />
      {helperText && <p className="mt-1 text-sm text-notpurple-300">{helperText}</p>}
      {errorMessage && <p className="mt-1 text-sm text-ualert-500">{errorMessage}</p>}
    </div>
  );
};