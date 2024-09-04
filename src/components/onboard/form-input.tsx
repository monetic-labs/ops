import { InputProps } from "@nextui-org/input";
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
      <label className="block text-sm font-medium text-notpurple-100 mb-1" htmlFor={name}>
        {props.label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <input
            {...field}
            className="w-full p-2 border border-notpurple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-notpurple-500"
            maxLength={props.maxLength}
            placeholder={props.placeholder}
          />
        )}
      />
      {helperText && <p className="mt-1 text-sm text-notpurple-300">{helperText}</p>}
      {errorMessage && <p className="mt-1 text-sm text-red-500">{errorMessage}</p>}
    </div>
  );
};
