import React, { useState } from "react";
import { Controller, useForm, Control, FieldErrors, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Tooltip } from "@nextui-org/tooltip";

import { emailRegex } from "@/validations/auth";
import { merchantCreateSchema, MerchantFormData } from "@/validations/merchant";

interface CompanyOwnerProps {
  control: Control<MerchantFormData>;
  errors: FieldErrors<MerchantFormData>;
  fields: any[];
  append: () => void;
  remove: (index: number) => void;
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
  initialEmail: string;
}

export const CompanyOwner: React.FC<CompanyOwnerProps> = ({
  handleCancel,
  onSubmitStep,
  stepCompletion,
  initialEmail,
}) => {
  const methods = useForm<MerchantFormData>({
    resolver: zodResolver(merchantCreateSchema),
    mode: "onChange",
    defaultValues: {
      representatives: [{ email: initialEmail, name: "", surname: "", phoneNumber: "" }],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });

  // Watch all representative fields
  const representatives = watch("representatives");

  // Check if all required fields are filled for each representative
  const isStep2Complete = representatives.every((rep) => rep.name && rep.surname && rep.email && rep.phoneNumber);

  const [selectedTab, setSelectedTab] = useState(0);

  const onSubmit = (data: MerchantFormData) => {
    if (isValid) {
      onSubmitStep(2);
    } else {
      console.error("Form submitted with invalid data");
    }
  };

  const addOwner = () => {
    append({ walletAddress: "", name: "", surname: "", email: "", phoneNumber: "" });
    // Optionally, switch to the new tab
    setSelectedTab(fields.length);
  };

  const removeOwner = () => {
    if (fields.length > 1) {
      remove(selectedTab);
      // Adjust selected tab if necessary
      if (selectedTab === fields.length - 1) {
        setSelectedTab(selectedTab - 1);
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Tabs
            aria-label="Company Owners"
            selectedKey={selectedTab.toString()}
            onSelectionChange={(key) => setSelectedTab(parseInt(key.toString()))}
          >
            {fields.map((field, index) => {
              const ownerName = representatives[index]?.name || "";
              const ownerSurname = representatives[index]?.surname || "";
              const tabTitle = ownerName && ownerSurname ? `${ownerName} ${ownerSurname}` : `Owner ${index + 1}`;

              return (
                <Tab key={index.toString()} title={tabTitle}>
                  <div className="space-y-4 mt-4">
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
                            maxLength={20}
                            placeholder="Rick"
                          />
                        </Tooltip>
                      )}
                      rules={{ required: "Owner name is required" }}
                    />
                    <Controller
                      control={control}
                      name={`representatives.${index}.surname`}
                      render={({ field }) => (
                        <Tooltip
                          className="tooltip-left-align"
                          content="Owner can be a business owner or a representative of the business"
                        >
                          <Input
                            {...field}
                            errorMessage={errors.representatives?.[index]?.surname?.message}
                            isInvalid={!!errors.representatives?.[index]?.surname}
                            label="Owner Last Name"
                            maxLength={20}
                            placeholder="Sanchez"
                          />
                        </Tooltip>
                      )}
                      rules={{ required: "Owner last name is required" }}
                    />
                    <Controller
                      control={control}
                      name={`representatives.${index}.email`}
                      render={({ field }) => (
                        <Tooltip className="tooltip-left-align" content="Email address for the above listed owner">
                          <Input
                            {...field}
                            defaultValue={index === 0 ? initialEmail : ""}
                            errorMessage={errors.representatives?.[index]?.email?.message}
                            isInvalid={!!errors.representatives?.[index]?.email}
                            label="Owner Email"
                            maxLength={50}
                            placeholder="rick@jerryboree.com"
                          />
                        </Tooltip>
                      )}
                      rules={{
                        required: "Owner email is required",
                        pattern: { value: emailRegex, message: "Invalid email address" },
                      }}
                    />
                    <Controller
                      control={control}
                      name={`representatives.${index}.phoneNumber`}
                      render={({ field }) => (
                        <Tooltip
                          className="tooltip-left-align"
                          content="Primary phone number of the above listed owner"
                        >
                          <Input
                            {...field}
                            errorMessage={errors.representatives?.[index]?.phoneNumber?.message}
                            isInvalid={!!errors.representatives?.[index]?.phoneNumber}
                            label="Owner Phone"
                            maxLength={15}
                            placeholder="5555555555"
                          />
                        </Tooltip>
                      )}
                      rules={{ required: "Owner phone is required" }}
                    />
                  </div>
                </Tab>
              );
            })}
          </Tabs>
          <div className="flex justify-between mt-4">
            <div className="space-x-2">
              <Tooltip content="Add another owner or representative to your company">
                <Button className="text-notpurple-500" variant="light" onClick={addOwner}>
                  Add
                </Button>
              </Tooltip>
              {fields.length > 1 && (
                <Tooltip content="Remove selected owner">
                  <Button className="text-notpurple-500" variant="light" onClick={removeOwner}>
                    Remove
                  </Button>
                </Tooltip>
              )}
            </div>

            {/* Right group: Cancel and Submit buttons */}
            <div className="space-x-2">
              <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                className={`bg-ualert-500 ${!isStep2Complete ? "button-disabled" : ""}`}
                disabled={!isStep2Complete}
                onClick={() => onSubmitStep(2)}
              >
                Submit Owner Info
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
