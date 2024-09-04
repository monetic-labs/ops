import React from "react";
import { Controller, useWatch } from "react-hook-form";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

interface CompanyOwnerProps {
  control: any;
  errors: any;
  fields: any[];
  append: () => void;
  remove: (index: number) => void;
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
  initialEmail: string;
}

export const CompanyOwner: React.FC<CompanyOwnerProps> = ({
  control,
  errors,
  fields,
  append,
  remove,
  handleCancel,
  onSubmitStep,
  stepCompletion,
  initialEmail,
}) => {
  const watchedFields = useWatch({
    control,
    name: fields
      .map((_, index) => [
        `representatives.${index}.name`,
        `representatives.${index}.surname`,
        `representatives.${index}.email`,
        `representatives.${index}.phoneNumber`,
      ])
      .flat(),
  });

  const isStep2Complete = watchedFields.every((field) => field && field.trim() !== "");

  return (
    <div className="space-y-4">
      <Tabs aria-label="Company Owners">
        {fields.map((field, index) => (
          <Tab key={field.id} title={`Owner ${index + 1}`}>
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
                      //label="Owner Name"
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
                  <Tooltip className="tooltip-left-align" content="Last name of the company owner (e.g., Doe)">
                    <Input
                      {...field}
                      errorMessage={errors.representatives?.[index]?.surname?.message}
                      isInvalid={!!errors.representatives?.[index]?.surname}
                      label="Owner Last Name"
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
                  <Tooltip
                    className="tooltip-left-align"
                    content="Email address of the company owner (e.g., john.doe@acmecorp.com)"
                  >
                    <Input
                      {...field}
                      defaultValue={index === 0 ? initialEmail : ""}
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
            </div>
          </Tab>
        ))}
      </Tabs>
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={() => append()}>
          Add Additional Owner
        </Button>
        {fields.length > 1 && (
          <Button className="text-notpurple-500" variant="light" onClick={() => remove(fields.length - 1)}>
            Remove Last Owner
          </Button>
        )}
      </div>
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!isStep2Complete ? "button-disabled" : ""}`}
          disabled={!isStep2Complete}
          onClick={() => onSubmitStep(2)}
        >
          Step 2: Submit Owner Info
        </Button>
      </div>
    </div>
  );
};
