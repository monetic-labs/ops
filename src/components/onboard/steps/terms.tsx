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
      <div className="flex justify-between">
        <Checkbox
          {...register("acceptedTerms")}
          classNames={{
            wrapper:
              "before:border-ualert-500 group-data-[selected=true]:before:border-ualert-500 group-data-[selected=true]:before:bg-ualert-500 group-data-[selected=true]:after:bg-ualert-500",
          }}
          icon={<CustomCheckIcon className="text-white" />}
          size="lg"
          onValueChange={handleAcceptTerms}
        />
        <div>
          I acknowledge and accept the{" "}
          <span
            className="text-ualert-500 underline cursor-pointer z-10"
            onClick={(e) => {
              window.open("https://backpack.com/terms-and-conditions", "_blank");
            }}
          >
            terms and conditions
          </span>{" "}
          as well as{" "}
          <span
            className="text-ualert-500 underline cursor-pointer z-10"
            onClick={(e) => {
              window.open("https://backpack.com/privacy-policy", "_blank");
            }}
          >
            privacy policy
          </span>{" "}
          for Backpack, including but not limited to, the Rain Card and Bill Pay services.
        </div>
      </div>
    </div>
  );
};
