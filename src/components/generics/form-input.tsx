import { Input, InputProps } from "@nextui-org/input";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FormInputProps<T extends FieldValues> extends Omit<InputProps, "name"> {
  name: Path<T>;
  control: Control<T>;
  errorMessage?: string;
  helperText?: string;
}

export const FormInput = <T extends FieldValues>({
  name,
  control,
  errorMessage,
  helperText,
  ...props
}: FormInputProps<T>) => {
  return (
    <div className="mb-4">
      <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          {...field}
          {...props}
          errorMessage={errorMessage}
          helperText={helperText}
        />
      )}
    />
      {helperText && <p className="mt-1 text-sm text-notpurple-300">{helperText}</p>}
      {errorMessage && <p className="mt-1 text-sm text-red-500">{errorMessage}</p>}
    </div>
  );
};
