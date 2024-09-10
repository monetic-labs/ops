import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

import { usePostcodeLookup } from '@/hooks/merchant/usePostcodeLookup';
import { FormInput } from '@/components/generics/form-input';

interface PostcodeInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
  onLookupComplete?: (result: any) => void;
}

export const PostcodeInput = <T extends FieldValues>({ 
  name, 
  control, 
  onLookupComplete,
  ...props
}: PostcodeInputProps<T>) => {
  const { lookup, isLoading, error, result } = usePostcodeLookup();

  const handlePostcodeChange = async (value: string) => {
    if (value.length === 5) {
      await lookup(value);
      if (result && onLookupComplete) {
        onLookupComplete(result);
      }
    }
  };

  return (
    <div>
      <FormInput
        name={name}
        control={control}
        label="Postcode"
        maxLength={5}
        minLength={5}
        pattern="[0-9]*"
        // onChange={(e) => handlePostcodeChange(e.target.value)}
        {...props}
      />
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};