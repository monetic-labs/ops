"use client";

import React, { useEffect } from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { Tooltip } from "@nextui-org/tooltip";

import { usePostcodeLookup } from "@/hooks/generics/usePostcodeLookup";
import { FormInput } from "@/components/generics/form-input";
import { postcodeRegex } from "@/types/validations/onboard";

interface PostcodeInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
  showAddressInputs?: boolean;
  about?: string;
  watchPostcode?: string;
  onLookupComplete?: (result: any) => void;
  testId?: string;
}

export const PostcodeInput = <T extends FieldValues>({
  about,
  name,
  control,
  showAddressInputs,
  errorMessage,
  onLookupComplete,
  watchPostcode,
  testId,
  ...props
}: PostcodeInputProps<T>) => {
  const { lookup, isLoading, error, result } = usePostcodeLookup();
  const { field } = useController({ name, control });

  const handlePostcodeChange = async (value: string) => {
    const numericValue = value.replace(/\D/g, "");

    field.onChange(numericValue);

    if (numericValue.length === 5) {
      const lookupResult = await lookup(numericValue);

      if (lookupResult && onLookupComplete) {
        onLookupComplete(lookupResult);
      }
    } else if (onLookupComplete) {
      onLookupComplete(null);
    }
  };

  useEffect(() => {
    if (watchPostcode && watchPostcode.length === 5) {
      handlePostcodeChange(watchPostcode);
    }
  }, [watchPostcode]);

  const postcodeInput = (
    <div className="flex flex-col">
      <div className="flex items-center space-x-4 p-1 bg-charyo-800/30 rounded-lg">
        <div className="w-1/4">
          <FormInput
            className="text-notpurple-500"
            control={control}
            data-testid={testId}
            inputMode="numeric"
            label="Postcode"
            maxLength={5}
            minLength={5}
            name={name}
            pattern={postcodeRegex.source}
            placeholder="12345"
            type="text"
            value={watchPostcode}
            onChange={(e) => handlePostcodeChange(e.target.value)}
            {...props}
          />
        </div>
        <div className="w-3/4 flex space-x-4 mb-1 ">
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">City</p>
            <p className="text-sm text-notpurple-300" data-testid={`${testId}-city`}>
              {result?.city || "-"}
            </p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">State</p>
            <p className="text-sm text-notpurple-300" data-testid={`${testId}-state`}>
              {result?.state || "-"}
            </p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">Country</p>
            <p className="text-sm text-notpurple-300" data-testid={`${testId}-country`}>
              {result?.country || "-"}
            </p>
          </div>
        </div>
      </div>
      <div className="h-4">
        {isLoading && (
          <p className="text-sm text-notpurple-300" data-testid={`${testId}-loading`}>
            Loading...
          </p>
        )}
        {error && <p className="text-sm text-ualert-500">{error}</p>}
      </div>
    </div>
  );

  return about ? <Tooltip content={about}>{postcodeInput}</Tooltip> : postcodeInput;
};
