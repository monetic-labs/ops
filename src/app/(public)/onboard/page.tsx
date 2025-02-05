"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Modal, ModalContent } from "@nextui-org/modal";

import { schema, FormData } from "@/validations/onboard/schemas";
import { LocalStorage } from "@/utils/localstorage";
import { OnboardingState } from "@/contexts/AccountContext";
import { StatusModal, StatusStep } from "@/components/onboard/status-modal";

import { CircleWithNumber, CheckCircleIcon } from "./components/StepIndicator";
import { getDefaultValues, getFieldsForStep } from "./types";
import { handleSubmit } from "./handlers/submit-handler";
import { getSteps } from "./config/steps";

export default function OnboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([
    { message: "Creating merchant account...", isComplete: false },
    { message: "Setting up account recovery...", isComplete: false },
    { message: "Redirecting to compliance portal...", isComplete: false },
  ]);

  const [onboardingState] = useState<OnboardingState>(() => {
    const state = LocalStorage.getOnboardingState();

    if (!state) {
      router.push("/auth");
      throw new Error("Missing onboarding state");
    }

    return state;
  });

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues({ settlementAddress: onboardingState.settlementAddress }),
  });

  const {
    handleSubmit: handleFormSubmit,
    watch,
    formState: { errors, isValid, isValidating },
    setError,
    clearErrors,
    trigger,
  } = methods;

  const updateStatusStep = (step: number, isComplete: boolean) => {
    setStatusSteps((steps) => steps.map((s, i) => (i === step ? { ...s, isComplete } : s)));
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
          person1.phoneNumber?.number?.length >= 9;

        if (!isValidPerson1) {
          setError("users", {
            type: "required",
            message: "Please fill out all required fields for Person 1",
          });

          return;
        }

        const phoneNumbers = users.map((user) => user.phoneNumber?.number).filter(Boolean);
        const hasDuplicatePhones = new Set(phoneNumbers).size !== phoneNumbers.length;

        if (hasDuplicatePhones) {
          users.forEach((_, index) => {
            setError(`users.${index}.phoneNumber`, {
              type: "validate",
              message: "Phone number must be unique",
            });
          });

          return;
        }

        clearErrors("users");
        setCurrentStep(Math.min(currentStep + 1, 6));

        return;
      }
      default: {
        const fields = getFieldsForStep(currentStep);
        const isStepValid = await trigger(fields);

        if (isStepValid) {
          setCurrentStep(Math.min(currentStep + 1, 6));
        }
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleEdit = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const onSubmit = handleFormSubmit(async (formData) => {
    setIsSubmitting(true);
    try {
      await handleSubmit({
        formData,
        onboardingState,
        updateStatusStep,
        setError,
        onSuccess: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setIsSubmitting(false);
          setIsRedirecting(true);
          router.push("/");
        },
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  });

  const steps = getSteps();

  return (
    <section className="w-full relative z-10 max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<Spinner className="w-full h-full" />}>
        <FormProvider {...methods}>
          <form noValidate onSubmit={onSubmit}>
            <Accordion className="bg-charyo-500" selectedKeys={[currentStep.toString()]} variant="shadow">
              {steps.map((step, index) => (
                <AccordionItem
                  key={step.number}
                  aria-label={step.title}
                  classNames={{
                    title: "text-lg font-bold text-notpurple-500",
                    heading: "pointer-events-none cursor-default",
                    content: "p-6 text-notpurple-500",
                    indicator: "text-notpurple-500",
                  }}
                  isDisabled={index > currentStep}
                  startContent={
                    currentStep > Number(step.number) ? <CheckCircleIcon /> : <CircleWithNumber number={step.number} />
                  }
                  title={step.title}
                >
                  {step.content({
                    isValidating,
                    onNext: handleNext,
                    onPrevious: handlePrevious,
                    onStepChange: handleEdit,
                    isSubmitting,
                    isValid,
                  })}
                </AccordionItem>
              ))}
            </Accordion>
          </form>
        </FormProvider>
      </Suspense>

      {/* Status Modal */}
      <StatusModal isOpen={isSubmitting} steps={statusSteps} />

      {/* Redirect Loading State */}
      <Modal
        hideCloseButton
        classNames={{
          base: "bg-zinc-900/95 shadow-xl border border-white/10",
          body: "p-0",
        }}
        isDismissable={false}
        isOpen={isRedirecting}
        size="sm"
      >
        <ModalContent>
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Spinner color="white" size="lg" />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Checking Compliance Status</h2>
                <p className="text-white/60">Please wait while we verify your account...</p>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </section>
  );
}
