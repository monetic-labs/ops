import { FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
import { birthdayRegex, CompanyAccountSchema, CompanyDetailsSchema, companyEINRegex, phoneRegex, ssnRegex, walletAddressRegex } from "@/types/validations/onboard";

export interface PostcodeLookupResult {
    postcode: string;
    city: string;
    state: string;
    country: string;
}

export const handleBirthdayChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setBirthdayInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Format as YYYY-MM-DD
    if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4);
    if (value.length > 7) value = value.slice(0, 7) + '-' + value.slice(7);
    value = value.slice(0, 10);  // Limit to 10 characters (YYYY-MM-DD)
  
    setBirthdayInput(value);
    
    if (birthdayRegex.test(value) || value === '') {
      setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
    }
};

export const handleCompanyEINChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setCompanyEINInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value.replace(/[^\d-]/g, '');
    
    // Format the EIN as XX-XXXXXXX
    if (value.length > 2 && !value.includes('-')) {
      value = `${value.slice(0, 2)}-${value.slice(2)}`;
    }
    
    setCompanyEINInput(value);
    
    if (companyEINRegex.test(value) || value === '') {
      setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
    }
};

export const handleEmailChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setEmailInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    const value = e.target.value;
    setEmailInput(value);
    setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
};

export const handlePhoneNumberChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setPhoneNumberInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 15 digits (maximum allowed by E.164 standard)
    value = value.slice(0, 15);
    
    setPhoneNumberInput(value);
    
    if (phoneRegex.test(value) || value === '') {
      setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
    }
};

export const handlePostcodeLookup = <T extends FieldValues>(
    result: PostcodeLookupResult | null,
    setValue: UseFormSetValue<T>,
    setShowAddressInputs: React.Dispatch<React.SetStateAction<boolean>>,
    basePath: Path<T>
  ) => {
    if (result) {
      const fieldMappings: Record<keyof PostcodeLookupResult, string> = {
        postcode: 'postcode',
        city: 'city',
        state: 'state',
        country: 'country'
      };
  
      Object.entries(fieldMappings).forEach(([key, field]) => {
        setValue(
          `${basePath}.${field}` as Path<T>,
          result[key as keyof PostcodeLookupResult] as PathValue<T, Path<T>>,
          { shouldValidate: true }
        );
      });
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  };

export const handleSSNChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setSSNInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
    if (value.length > 6) value = value.slice(0, 6) + '-' + value.slice(6);
    value = value.slice(0, 11);  // Limit to 11 characters (XXX-XX-XXXX)
  
    setSSNInput(value);
    
    if (ssnRegex.test(value) || value === '') {
      setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
    }
};

export const handleWebsiteChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setWebsiteInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value;
    setWebsiteInput(value);
  
    // Add https:// if not present when setting the form value
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      value = `https://${value}`;
    }
  
    setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
};

export const handleWalletAddressChange = <T extends FieldValues>(
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: UseFormSetValue<T>,
    setWalletAddressInput: React.Dispatch<React.SetStateAction<string>>,
    fieldName: Path<T>
  ) => {
    let value = e.target.value.toLowerCase().trim();
    
    // Ensure the address starts with "0x"
    if (!value.startsWith("0x")) {
      value = "0x" + value.replace(/^0x/i, "");
    }
    
    // Limit the total length to 42 characters (including "0x")
    value = value.slice(0, 42);
    
    setWalletAddressInput(value);
    
    if (walletAddressRegex.test(value) || value === "0x") {
      setValue(fieldName, value as PathValue<T, Path<T>>, { shouldValidate: true });
    }
  };
  


// Add more handlers for other input types...