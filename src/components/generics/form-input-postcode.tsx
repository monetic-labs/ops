"use client";

import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import { usePostcodeLookup } from "@/hooks/generics/usePostcodeLookup";
import { FormInput } from "@/components/generics/form-input";
import { postcodeRegex } from "@/types/validations/onboard";
import { Tooltip } from "@nextui-org/tooltip";

interface PostcodeInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
  onLookupComplete?: (result: any) => void;
  showAddressInputs?: boolean;
  about?: string;
}

export const PostcodeInput = <T extends FieldValues>({
  name,
  control,
  onLookupComplete,
  showAddressInputs,
  about,
  ...props
}: PostcodeInputProps<T>) => {
  const { lookup, isLoading, error, result } = usePostcodeLookup();

  const handlePostcodeChange = async (value: string) => {
    if (value.length === 5) {
      const lookupResult = await lookup(value); // Capture the result directly

      if (lookupResult && onLookupComplete) {
        onLookupComplete(lookupResult); // Pass the result to the parent
      }
    } else if (onLookupComplete) {
      onLookupComplete(null); // Pass null to indicate no lookup result
    }
  };

  const postcodeInput = (
    <div className="flex flex-col">
      <div className="flex items-center space-x-4 p-1 bg-charyo-800/30 rounded-lg">
        <div className="w-1/4">
          <FormInput
            className="text-notpurple-500"
            control={control}
            label="Postcode"
            maxLength={5}
            minLength={5}
            name={name}
            pattern={postcodeRegex.source}
            placeholder="12345"
            onChange={(e) => handlePostcodeChange(e.target.value)}
            {...props}
          />
        </div>
        <div className="w-3/4 flex space-x-4 mb-1 ">
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">City</p>
            <p className="text-sm text-notpurple-300">{result?.city || "-"}</p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">State</p>
            <p className="text-sm text-notpurple-300">{result?.state || "-"}</p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">Country</p>
            <p className="text-sm text-notpurple-300">{result?.country || "-"}</p>
          </div>
        </div>
      </div>
      <div className="h-4">
        {isLoading && <p className="text-sm text-notpurple-300">Loading...</p>}
        {error && <p className="text-sm text-ualert-500">{error}</p>}
      </div>
    </div>
  );

  return about ? <Tooltip content={about}>{postcodeInput}</Tooltip> : postcodeInput;
};
