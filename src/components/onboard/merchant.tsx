"use client";

import { useState, useRef } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { useRouter } from "next/navigation";

import { MerchantFormData } from "@/data/merchant";
import { FormCard } from "@/components/onboard/form-card";
import { useIssueOTP, useVerifyOTP } from "@/hooks/auth/useOTP";
import { lookupZipCode } from "@/utils/helpers";

import { AddressModal } from "./address-modal";

const OTP_LENGTH = 6;

// TODO: these rendering functions should be converted to a reusable component
export const KYBMerchantForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [activeTab, setActiveTab] = useState("company-info");
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
  } = useForm<MerchantFormData>({
    defaultValues: {
      representatives: [{ name: "", surname: "", email: "", phoneNumber: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });
  const [otp, setOtp] = useState("");
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const { issueOTP, isLoading: isIssueLoading, error: issueError } = useIssueOTP();
  const { verifyOTP, isLoading: isVerifyLoading, error: verifyError } = useVerifyOTP();
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [addressLookup, setAddressLookup] = useState<{
    city: string;
    state: string;
    postcode: string;
    country: string;
  } | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [stepCompletion, setStepCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
  });
  const router = useRouter();

  const handleZipCodeLookup = async (zipCode: string) => {
    if (zipCode.length === 5) {
      // Assuming US zip code
      try {
        const result = await lookupZipCode(zipCode);

        setAddressLookup(result);
        setIsAddressModalOpen(true);
      } catch (error) {
        console.error("Error looking up zip code:", error);
        // Handle error (e.g., show error message to user)
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = otp.split("");

    newOtp[index] = value;
    const updatedOtp = newOtp.join("");

    setOtp(updatedOtp);

    if (value !== "" && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (updatedOtp.length === OTP_LENGTH) {
      setIsOtpComplete(true);
      setTimeout(() => setIsOtpComplete(false), 1000);
      handleVerify(updatedOtp);
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async (otpValue: string) => {
    const email = getValues("owner.email");

    if (email && otpValue.length === OTP_LENGTH) {
      setOtpSubmitted(true);
      const response = await verifyOTP({ email, otp: otpValue });

      if (response) {
        console.log("OTP verified successfully");
        // Handle successful verification (e.g., move to next step)
      }
      setOtp("");
      otpInputs.current[0]?.focus();
      setTimeout(() => setOtpSubmitted(false), 2000);
    }
  };

  const handleResendOTP = async () => {
    const email = getValues("owner.email");

    if (email) {
      await issueOTP(email);
    }
  };

  const onSubmitStep = async (step: number) => {
    const isValid = await trigger();

    if (!isValid) return;

    const data = getValues();

    console.log(`Step ${step} data:`, data);

    if (step === 1) {
      setStepCompletion({ ...stepCompletion, step1: true });
    } else if (step === 2) {
      setStepCompletion({ ...stepCompletion, step2: true });
    } else if (step === 3) {
      // Combine data from steps 1 and 2 and send to pylon service
      const combinedData = {
        company: data.company,
        representatives: data.representatives,
      };

      console.log("Combined data to send to pylon service:", combinedData);
      // TODO: Implement pylon service integration
      // await sendToPylonService(combinedData);
      setStepCompletion({ ...stepCompletion, step3: true });
    }

    // Move to the next tab
    const tabKeys = ["company-info", "company-owner", "documents", "validate"];
    const nextTabIndex = tabKeys.indexOf(activeTab) + 1;

    if (nextTabIndex < tabKeys.length) {
      setActiveTab(tabKeys[nextTabIndex]);
    }
  };

  const handleCancel = () => {
    router.push("/auth");
  };

  // Watch form fields for step 1
  const companyName = watch("company.name");
  const companyEmail = watch("company.email");
  const companyPostcode = watch("company.mailingAddress.postcode");
  const companySettlementAddress = watch("company.settlementAddress");

  // Check if step 1 is complete
  const isStep1Complete = companyName && companyEmail && companyPostcode && companySettlementAddress;

  const renderCompanyInfo = () => (
    <div className="space-y-4">
      <Controller
        control={control}
        name="company.name"
        render={({ field }) => (
          <Tooltip
            className="tooltip-left-align"
            content="Official registered name of your company (e.g., Acme Corporation)"
          >
            <Input
              {...field}
              errorMessage={errors.company?.name?.message}
              isInvalid={!!errors.company?.name}
              label="Company Name"
              placeholder="Enter company name"
            />
          </Tooltip>
        )}
        rules={{ required: "Company name is required" }}
      />
      <Controller
        control={control}
        name="company.email"
        render={({ field }) => (
          <Tooltip
            className="tooltip-left-align"
            content="Official email address for business communications (e.g., info@acmecorp.com)"
          >
            <Input
              {...field}
              errorMessage={errors.company?.email?.message}
              isInvalid={!!errors.company?.email}
              label="Company Email"
              placeholder="Enter company email"
            />
          </Tooltip>
        )}
        rules={{
          required: "Company email is required",
          pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
        }}
      />
      <Controller
        control={control}
        name="company.mailingAddress.postcode"
        render={({ field }) => (
          <Tooltip className="tooltip-left-align" content="5-digit ZIP code for US addresses (e.g., 90210)">
            <Input
              {...field}
              errorMessage={errors.company?.mailingAddress?.postcode?.message}
              isInvalid={!!errors.company?.mailingAddress?.postcode}
              label="Postal Code"
              placeholder="Enter postal code"
              onChange={(e) => {
                field.onChange(e);
                handleZipCodeLookup(e.target.value);
              }}
            />
          </Tooltip>
        )}
        rules={{ required: "Postal code is required" }}
      />
      <Controller
        control={control}
        name="company.settlementAddress"
        render={({ field }) => (
          <Tooltip
            className="tooltip-left-align"
            content="Full address where payments will be settled (e.g., 123 Main St, Anytown, CA 90210)"
          >
            <Input
              {...field}
              errorMessage={errors.company?.settlementAddress?.message}
              isInvalid={!!errors.company?.settlementAddress}
              label="Settlement Address"
              placeholder="Enter settlement address"
            />
          </Tooltip>
        )}
        rules={{ required: "Settlement address is required" }}
      />
      <AddressModal
        control={control}
        defaultValues={addressLookup || { city: "", state: "", postcode: "", country: "" }}
        errors={errors}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onConfirm={() => {
          setIsAddressModalOpen(false);
          // You might want to trigger form validation here
        }}
      />
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!isStep1Complete ? "button-disabled" : ""}`}
          disabled={!isStep1Complete}
          onClick={() => onSubmitStep(1)}
        >
          Step 1: Submit Company Info
        </Button>
      </div>
    </div>
  );

  const renderCompanyOwner = () => (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4">
          <p className="text-notpurple-100">Owner {index + 1}</p>
          <Controller
            control={control}
            name={`representatives.${index}.name`}
            render={({ field }) => (
              <Tooltip className="tooltip-left-align" content="First name of the company owner (e.g., John)">
                <Input
                  {...field}
                  errorMessage={errors.representatives?.[index]?.name?.message}
                  isInvalid={!!errors.representatives?.[index]?.name}
                  label="Owner Name"
                  placeholder="Enter owner name"
                />
              </Tooltip>
            )}
            rules={{ required: "Owner name is required" }}
          />
          <Controller
            control={control}
            name={`representatives.${index}.surname`}
            render={({ field }) => (
              <Tooltip className="tooltip-left-align" content="Last name of the company owner (e.g., Doe)">
                <Input
                  {...field}
                  errorMessage={errors.representatives?.[index]?.surname?.message}
                  isInvalid={!!errors.representatives?.[index]?.surname}
                  label="Owner Surname"
                  placeholder="Enter owner last name"
                />
              </Tooltip>
            )}
            rules={{ required: "Owner last name is required" }}
          />
          <Controller
            control={control}
            name={`representatives.${index}.email`}
            render={({ field }) => (
              <Tooltip
                className="tooltip-left-align"
                content="Email address of the company owner (e.g., john.doe@acmecorp.com)"
              >
                <Input
                  {...field}
                  errorMessage={errors.representatives?.[index]?.email?.message}
                  isInvalid={!!errors.representatives?.[index]?.email}
                  label="Owner Email"
                  placeholder="Enter owner email"
                />
              </Tooltip>
            )}
            rules={{
              required: "Owner email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
            }}
          />
          <Controller
            control={control}
            name={`representatives.${index}.phoneNumber`}
            render={({ field }) => (
              <Tooltip
                className="tooltip-left-align"
                content="Phone number of the company owner (e.g., +1 234 567 890)"
              >
                <Input
                  {...field}
                  errorMessage={errors.representatives?.[index]?.phoneNumber?.message}
                  isInvalid={!!errors.representatives?.[index]?.phoneNumber}
                  label="Owner Phone"
                  placeholder="Enter owner phone"
                />
              </Tooltip>
            )}
            rules={{ required: "Owner phone is required" }}
          />
          {index > 0 && (
            <Button className="text-notpurple-500" variant="light" onClick={() => remove(index)}>
              Remove Owner
            </Button>
          )}
        </div>
      ))}
      <Button
        className="text-notpurple-500"
        variant="light"
        onClick={() => append({ name: "", surname: "", email: "", phoneNumber: "" })}
      >
        Add Additional Owner(s)
      </Button>
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step1 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step1}
          onClick={() => onSubmitStep(2)}
        >
          Step 2: Submit Owner Info
        </Button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <>
      <div className="h-96">
        {/* Add your iframe for document flow here */}
        <iframe className="w-full h-full" src="your-document-flow-url" title="Bridge Flow" />
      </div>
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step1 || !stepCompletion.step2 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step1 || !stepCompletion.step2}
          onClick={() => onSubmitStep(3)}
        >
          Step 3: Submit Documents
        </Button>
      </div>
    </>
  );

  const renderValidate = () => (
    <div className="space-y-4">
      <p className="text-notpurple-100">Enter the 6-digit OTP sent to your email.</p>
      <div className="flex flex-col items-center py-10">
        <div className="flex justify-center space-x-6">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                otpInputs.current[index] = el;
              }}
              className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
                ${
                  isOtpComplete
                    ? "animate-flash border-ualert-500"
                    : otpSubmitted
                    ? "border-green-500"
                    : "border-gray-300"
                }
                focus:border-ualert-500 focus:outline-none`}
              maxLength={1}
              type="text"
              value={otp[index] || ""}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !otp[index] && index > 0) {
                  otpInputs.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </div>
        {otpSubmitted && <p className="text-notpurple-500 mt-2">OTP submitted</p>}
      </div>

      {(issueError || verifyError) && <p className="text-ualert-500 mt-2">{issueError || verifyError}</p>}
      <div className="flex justify-between mt-4">
        <div className="flex space-x-2">
          <Button className="text-notpurple-500 hover:bg-ualert-500" variant="light" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="text-notpurple-500 hover:bg-ualert-900"
            disabled={isIssueLoading}
            variant="light"
            onClick={handleResendOTP}
          >
            Resend OTP
          </Button>
        </div>
        <Button
          className={`bg-ualert-500 ${
            !stepCompletion.step1 || !stepCompletion.step2 || !stepCompletion.step3 ? "button-disabled" : ""
          }`}
          disabled={!stepCompletion.step1 || !stepCompletion.step2 || !stepCompletion.step3}
          onClick={() => onSubmitStep(4)}
        >
          Step 4: Complete Validation
        </Button>
      </div>
    </div>
  );

  return (
    <FormCard title="KYB Merchant Onboarding" className="overflow-y-auto max-h-screen">
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Company Info">
          {renderCompanyInfo()}
        </Tab>
        <Tab key="company-owner" title="Company Owner">
          {renderCompanyOwner()}
        </Tab>
        <Tab key="documents" title="Documents">
          {renderDocuments()}
        </Tab>
        <Tab key="validate" title="Validate">
          {renderValidate()}
        </Tab>
      </Tabs>
    </FormCard>
  );
};
