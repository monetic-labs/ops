"use client";

import React, { useState } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

import { usePostcodeLookup } from '@/hooks/merchant/usePostcodeLookup';
import { FormInput } from '@/components/generics/form-input';
import { postcodeRegex } from '@/validations/onboard';

interface PostcodeInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
  onLookupComplete?: (result: any) => void;
  showAddressInputs?: boolean;
}

export const PostcodeInput = <T extends FieldValues>({ 
  name, 
  control, 
  onLookupComplete,
  ...props
}: PostcodeInputProps<T>) => {
  const { lookup, isLoading, error, result, setResult } = usePostcodeLookup();

  const handlePostcodeChange = async (value: string) => {
    if (value.length === 5) {
      await lookup(value);
      if (result && onLookupComplete) {
        onLookupComplete(result);
      }
    } else if (onLookupComplete) {
      onLookupComplete(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-4 p-1 bg-charyo-800/30 rounded-lg">
        <div className="w-1/4">
          <FormInput
            name={name}
            control={control}
            label="Postcode"
            placeholder="12345"
            maxLength={5}
            minLength={5}
            pattern={postcodeRegex.source}
            onChange={(e) => handlePostcodeChange(e.target.value)}
            className='text-notpurple-500'
            {...props}
          />
        </div>
        <div className="w-3/4 flex space-x-4 mb-1 ">
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">City</p>
            <p className="text-sm text-notpurple-300">{result?.city || '-'}</p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">State</p>
            <p className="text-sm text-notpurple-300">{result?.state || '-'}</p>
          </div>
          <div className="w-1/3">
            <p className="text-sm text-notpurple-100 mb-1">Country</p>
            <p className="text-sm text-notpurple-300">{result ? 'US' : '-'}</p>
          </div>
        </div>
      </div>
      <div className="h-4">
        {isLoading && <p className="text-sm text-notpurple-300">Loading...</p>}
        {error && <p className="text-sm text-ualert-500">{error}</p>}
      </div>
    </div>
   

  );
};
