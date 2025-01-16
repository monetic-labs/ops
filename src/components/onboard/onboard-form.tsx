"use client";

import { useState } from "react";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Button } from "@nextui-org/button";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Circle, CheckCircle } from "lucide-react";

import { schema, FormData, UserRole } from "@/validations/onboard/schemas";
import { CompanyDetailsStep } from "./steps/company-details";
import { CompanyAccountStep } from "./steps/company-account";
import { AccountUsers } from "./account-users";
import { TermsStep } from "./steps/terms";
import { ReviewStep } from "./steps/review";
import { UserDetailsStep } from "./steps/user-details";

// Helper function to get fields for current step
const getFieldsForStep = (step: number): (keyof FormData)[] => {
  switch (step) {
    case 1:
      return [
        "companyName",
        "companyEmail",
        "companyWebsite",
        "postcode",
        "city",
        "state",
        "streetAddress1",
        "streetAddress2",
      ];
    case 2:
      return ["settlementAddress", "companyRegistrationNumber", "companyTaxId", "companyType", "companyDescription"];
    case 3:
      return ["users"];
    case 4:
      return ["users"];
    case 5:
      return ["acceptedBillPay", "acceptedCardProgram", "acceptedTerms"];
    default:
      return [];
  }
};

const getDefaultValues = (email: string): Partial<FormData> => ({
  companyEmail: email,
  acceptedTerms: false,
  users: [
    {
      firstName: "",
      lastName: "",
      email: email,
      phoneNumber: "",
      roles: [UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE],
      countryOfIssue: "",
      birthDate: "",
      socialSecurityNumber: "",
      postcode: "",
      city: "",
      state: "",
      streetAddress1: "",
      streetAddress2: "",
    },
  ],
});

const CircleWithNumber = ({ number }: { number: string }) => (
  <div className="relative flex items-center justify-center w-10 h-10">
    <Circle className="w-10 h-10 text-white" />
    <span className="absolute text-white font-bold">{number}</span>
  </div>
);

const CheckCircleIcon = () => (
  <div className="flex items-center justify-center w-10 h-10">
    <CheckCircle className="w-10 h-10 text-green-500" />
  </div>
);

const StepNavigation = ({
  onNext,
  onPrevious,
  isValidating,
  isFirstStep,
  isLastStep,
  isSubmitting,
  isValid,
}: {
  onNext?: () => void;
  onPrevious?: () => void;
  isValidating?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  isValid?: boolean;
}) => (
  <div className="flex justify-end space-x-4">
    {!isFirstStep && (
      <Button variant="bordered" onClick={onPrevious}>
        Previous
      </Button>
    )}
    {!isLastStep ? (
      <Button
        className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
        color="default"
        isDisabled={isValidating}
        onClick={onNext}
      >
        Next
      </Button>
    ) : (
      <Button
        className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
        color="default"
        isDisabled={isSubmitting || !isValid}
        type="submit"
      >
        Submit
      </Button>
    )}
  </div>
);

export function OnboardForm({ email }: { email: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(email),
  });

  const {
    handleSubmit,
    formState: { errors, isValid, isValidating },
    trigger,
    watch,
    setError,
    clearErrors,
  } = methods;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      // Handle form submission
      console.log(data);
      // Add your API call here
    } catch (error: any) {
      // Handle API errors by setting form errors
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key as any, {
            type: "manual",
            message: value as string,
          });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 3: {
        const users = watch("users");
        const person1 = users[0];
        const isValidPerson1 =
          person1 &&
          person1.firstName?.length >= 2 &&
          person1.lastName?.length >= 2 &&
          person1.email &&
          person1.phoneNumber?.length >= 9;

        if (!isValidPerson1) {
          setError("users", {
            type: "manual",
            message: "Please fill out all required fields for Person 1",
          });
          return;
        }

        const hasBeneficialOwner = users.some((user) => user.roles?.includes("beneficial_owner"));
        const hasRepresentative = users.some((user) => user.roles?.includes("representative"));

        if (!hasBeneficialOwner || !hasRepresentative) {
          setError("users", {
            type: "manual",
            message: "At least one Beneficial Owner and one Representative are required",
          });
          return;
        }

        clearErrors("users");
        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
        return;
      }
      default: {
        const fields = getFieldsForStep(currentStep);
        const isStepValid = await trigger(fields);

        if (isStepValid) {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length));
        }
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    {
      number: "1",
      title: "Company Account",
      content: (
        <>
          <CompanyDetailsStep />
          <StepNavigation onNext={handleNext} isValidating={isValidating} isFirstStep />
        </>
      ),
    },
    {
      number: "2",
      title: "Company Details",
      content: (
        <>
          <CompanyAccountStep />
          <StepNavigation onNext={handleNext} onPrevious={handlePrevious} isValidating={isValidating} />
        </>
      ),
    },
    {
      number: "3",
      title: "Account Users",
      content: (
        <>
          <AccountUsers />
          <StepNavigation onNext={handleNext} onPrevious={handlePrevious} isValidating={isValidating} />
        </>
      ),
    },
    {
      number: "4",
      title: "User Details",
      content: (
        <>
          <UserDetailsStep />
          <StepNavigation onNext={handleNext} onPrevious={handlePrevious} isValidating={isValidating} />
        </>
      ),
    },
    {
      number: "5",
      title: "Terms and Conditions",
      content: (
        <>
          <TermsStep />
          <StepNavigation onNext={handleNext} onPrevious={handlePrevious} isValidating={isValidating} />
        </>
      ),
    },
    {
      number: "6",
      title: "Review",
      content: (
        <>
          <ReviewStep onStepChange={setCurrentStep} />
          <StepNavigation onPrevious={handlePrevious} isLastStep isSubmitting={isSubmitting} isValid={isValid} />
        </>
      ),
    },
  ];

  return (
    <FormProvider {...methods}>
      <form noValidate className="max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
        <Accordion
          className="bg-charyo-500"
          selectedKeys={[currentStep.toString()]}
          variant="shadow"
          onSelectionChange={(keys) => {
            if (Array.isArray(keys) && keys.length > 0) {
              const newStep = Number(keys[0]);
              if (newStep <= currentStep || newStep === currentStep + 1) {
                setCurrentStep(newStep);
              }
            }
          }}
        >
          {steps.map((step, index) => (
            <AccordionItem
              key={step.number}
              aria-label={step.title}
              classNames={{
                title: "text-lg font-bold",
                heading: "pointer-events-none cursor-default",
                content: "p-6",
              }}
              isDisabled={index > currentStep}
              startContent={
                currentStep > Number(step.number) ? <CheckCircleIcon /> : <CircleWithNumber number={step.number} />
              }
              title={step.title}
            >
              {step.content}
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </FormProvider>
  );
}
