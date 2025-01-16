"use client";

import { Checkbox } from "@nextui-org/checkbox";
import { useFormContext } from "react-hook-form";

export const TermsStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rain Card</h3>
        <p className="text-default-500">
          By accepting the Rain Card Agreement, you agree to the{" "}
          <a
            className="text-[#E31B88] hover:underline"
            href="https://rain.us/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="text-[#E31B88] hover:underline"
            href="https://rain.us/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
          .
        </p>
        <Checkbox
          {...register("acceptedCardProgram")}
          classNames={{
            base: errors.acceptedCardProgram ? "border-red-500" : "",
          }}
        >
          I accept the Rain Card Agreement
        </Checkbox>
        {errors.acceptedCardProgram && (
          <p className="text-red-500 text-sm">{errors.acceptedCardProgram.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bill Pay</h3>
        <p className="text-default-500">
          By accepting the Bill Pay Agreement, you agree to the{" "}
          <a
            className="text-[#E31B88] hover:underline"
            href="https://rain.us/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="text-[#E31B88] hover:underline"
            href="https://rain.us/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
          .
        </p>
        <Checkbox
          {...register("acceptedBillPay")}
          classNames={{
            base: errors.acceptedBillPay ? "border-red-500" : "",
          }}
        >
          I accept the Bill Pay Agreement
        </Checkbox>
        {errors.acceptedBillPay && <p className="text-red-500 text-sm">{errors.acceptedBillPay.message?.toString()}</p>}
      </div>

      <div className="space-y-4">
        <Checkbox
          {...register("acceptedTerms")}
          classNames={{
            base: errors.acceptedTerms ? "border-red-500" : "",
          }}
        >
          I accept all terms and conditions
        </Checkbox>
        {errors.acceptedTerms && <p className="text-red-500 text-sm">{errors.acceptedTerms.message?.toString()}</p>}
      </div>
    </div>
  );
};
