"use client";

import { Checkbox } from "@nextui-org/checkbox";
import { useFormContext } from "react-hook-form";
import { Link } from "@nextui-org/link";

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
            label: errors?.acceptedTerms ? "text-red-500" : "",
          }}
          icon={<CustomCheckIcon className="text-white" />}
          size="lg"
          onValueChange={handleAcceptTerms}
        />
        <span>
          I acknowledge and accept the{" "}
          <Link
            isExternal
            showAnchorIcon
            className="text-ualert-500 cursor-pointer"
            href="https://backpack.network/terms-of-service"
          >
            terms of service
          </Link>{" "}
          as well as{" "}
          <Link
            isExternal
            showAnchorIcon
            className="text-ualert-500 cursor-pointer"
            href="https://backpack.network/privacy-policy"
          >
            privacy policy
          </Link>{" "}
          for Backpack, including but not limited to, the Rain Card and Bill Pay services.
        </span>
      </div>
      {errors?.acceptedTerms && <p className="text-red-500 text-sm">{errors.acceptedTerms.message?.toString()}</p>}
    </div>
  );
};
