"use client";

import { Checkbox } from "@nextui-org/checkbox";
import { useFormContext } from "react-hook-form";

const CustomCheckIcon = (props: { className: string }) => (
  <svg
    aria-hidden="true"
    className={props.className}
    fill="none"
    height="14"
    viewBox="0 0 24 24"
    width="14"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 13L9 17L19 7" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>
);

export const TermsStep = () => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  const handleAcceptTerms = (checked: boolean) => {
    setValue("acceptedTerms", checked, { shouldValidate: true });
  };

  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-4">
        <Checkbox
          {...register("acceptedTerms")}
          classNames={{
            base: errors.acceptedTerms ? "border-red-500" : "",
            wrapper:
              "before:border-[#E31B88] group-data-[selected=true]:before:border-[#E31B88] group-data-[selected=true]:before:bg-[#E31B88]",
          }}
          icon={<CustomCheckIcon className="text-white" />}
          size="lg"
          onValueChange={handleAcceptTerms}
        >
          I acknowledge and accept all terms and conditions for Backpack, including but not limited to, the Rain Card
          and Bill Pay services.
        </Checkbox>
        {errors.acceptedTerms && <p className="text-red-500 text-sm">{errors.acceptedTerms.message?.toString()}</p>}
      </div>
    </div>
  );
};
