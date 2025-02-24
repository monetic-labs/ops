"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Modal, ModalContent } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Sun, Moon } from "lucide-react";

import { schema, FormData, UserRole } from "@/validations/onboard/schemas";
import { LocalStorage, OnboardingState } from "@/utils/localstorage";
import { StatusModal, StatusStep } from "@/components/onboard/status-modal";
import { useTheme } from "@/hooks/useTheme";
import { ISO3166Alpha2Country, ISO3166Alpha3Country, PersonRole } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import { CircleWithNumber, CheckCircleIcon } from "./components/StepIndicator";
import { getDefaultValues, getFieldsForStep } from "./types";
import { getSteps } from "./config/steps";
import pylon from "@/libs/pylon-sdk";
import { setupSocialRecovery } from "@/utils/safe/onboard";

export default function OnboardPage() {
  const router = useRouter();
  const { toggleTheme, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([
    { message: "Creating merchant account...", isComplete: false },
    { message: "Setting up account recovery...", isComplete: false },
    { message: "Redirecting to compliance portal...", isComplete: false },
  ]);

  const [onboardingState] = useState<OnboardingState>(() => {
    const state = LocalStorage.getOnboarding();

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

  const handleSubmit = handleFormSubmit(async (formData) => {
    setIsSubmitting(true);
    try {
      // Create merchant account
      const response = await pylon.createMerchant({
        settlementAddress: onboardingState.settlementAddress,
        isTermsOfServiceAccepted: formData.acceptedTerms,
        company: {
          name: formData.companyName,
          email: formData.companyEmail,
          website: `https://${formData.companyWebsite}`,
          type: formData.companyType,
          registrationNumber: formData.companyRegistrationNumber,
          taxId: formData.companyTaxId,
          description: formData.companyDescription || undefined,
          registeredAddress: {
            street1: formData.streetAddress1,
            street2: formData.streetAddress2 || undefined,
            city: formData.city,
            postcode: formData.postcode,
            state: formData.state,
            country: ISO3166Alpha2Country.US,
          },
          controlOwner: {
            firstName: formData.users[0].firstName,
            lastName: formData.users[0].lastName,
            email: formData.users[0].email,
            phoneCountryCode: formData.users[0].phoneNumber.extension,
            phoneNumber: formData.users[0].phoneNumber.number,
            nationalId: formData.users[0].socialSecurityNumber,
            countryOfIssue: formData.users[0].countryOfIssue,
            birthDate: formData.users[0].birthDate,
            walletAddress: onboardingState.walletAddress,
            address: {
              line1: formData.users[0].streetAddress1,
              line2: formData.users[0].streetAddress2 || undefined,
              city: formData.users[0].city,
              region: formData.users[0].state,
              postalCode: formData.users[0].postcode,
              countryCode: ISO3166Alpha2Country.US,
              country: ISO3166Alpha3Country.USA,
            },
          },
          ultimateBeneficialOwners: formData.users
            .filter((user) => user.roles.includes(UserRole.BENEFICIAL_OWNER))
            .map((user) => ({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneCountryCode: user.phoneNumber.extension,
              phoneNumber: user.phoneNumber.number,
              nationalId: user.socialSecurityNumber,
              countryOfIssue: user.countryOfIssue,
              birthDate: user.birthDate,
              address: {
                line1: user.streetAddress1,
                line2: user.streetAddress2 || undefined,
                city: user.city,
                region: user.state,
                postalCode: user.postcode,
                countryCode: ISO3166Alpha2Country.US,
                country: ISO3166Alpha3Country.USA,
              },
            })),
          representatives: formData.users
            .filter((user) => user.roles.includes(UserRole.REPRESENTATIVE))
            .map((user) => ({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneCountryCode: user.phoneNumber.extension,
              phoneNumber: user.phoneNumber.number,
              nationalId: user.socialSecurityNumber,
              countryOfIssue: user.countryOfIssue,
              birthDate: user.birthDate,
              address: {
                line1: user.streetAddress1,
                line2: user.streetAddress2 || undefined,
                city: user.city,
                region: user.state,
                postalCode: user.postcode,
                countryCode: ISO3166Alpha2Country.US,
                country: ISO3166Alpha3Country.USA,
              },
            })),
        },
        users: formData.users
          .filter((user) => user.hasDashboardAccess)
          .map((user, index) => {
            const role = user.dashboardRole as PersonRole;
            return {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneCountryCode: user.phoneNumber.extension,
              phoneNumber: user.phoneNumber.number,
              birthDate: user.birthDate,
              nationalId: user.socialSecurityNumber,
              countryOfIssue: user.countryOfIssue,
              walletAddress: index === 0 ? onboardingState.walletAddress : undefined,
              role,
              passkeyId: index === 0 ? onboardingState.credentials.credentialId : undefined,
              address: {
                line1: user.streetAddress1,
                line2: user.streetAddress2 || undefined,
                city: user.city,
                region: user.state,
                postalCode: user.postcode,
                countryCode: ISO3166Alpha2Country.US,
                country: ISO3166Alpha3Country.USA,
              },
            };
          }),
      });

      updateStatusStep(0, true);

      if (response) {
        // Setup social recovery for the account
        await setupSocialRecovery({
          walletAddress: onboardingState.walletAddress as Address,
          credentials: onboardingState.credentials,
          recoveryMethods: {
            email: formData.users[0].email,
            phone: formData.users[0].phoneNumber.number,
          },
          callbacks: {
            onRecoverySetup: () => updateStatusStep(1, true),
            onError: () => setIsSubmitting(false),
          },
        });

        updateStatusStep(2, true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsRedirecting(true);
        router.push("/");
      }
    } catch (error) {
      console.error("Error in onboarding process:", error);
      setIsSubmitting(false);
    }
  });

  const steps = getSteps();

  return (
    <section className="w-full relative z-10 max-w-3xl mx-auto px-4 py-12">
      {/* Theme Toggle */}
      <Button
        isIconOnly
        className="fixed top-4 right-4 z-50 bg-content1/10 backdrop-blur-lg border border-border"
        radius="lg"
        variant="flat"
        onPress={toggleTheme}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Complete Your Setup</h1>
        <p className="text-foreground/60">Let&apos;s get your business account ready for use</p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/50 to-background/80 rounded-2xl" />
        <div className="relative bg-content1/40 backdrop-blur-xl border border-border rounded-2xl shadow-xl">
          <FormProvider {...methods}>
            <form noValidate onSubmit={handleSubmit}>
              <Accordion className="p-1" selectedKeys={[currentStep.toString()]} variant="shadow">
                {steps.map((step, index) => (
                  <AccordionItem
                    key={step.number}
                    aria-label={step.title}
                    classNames={{
                      base: [
                        "bg-content1/40 backdrop-blur-xl border-none rounded-xl mb-2 last:mb-0",
                        "data-[open=true]:bg-content2/40",
                        currentStep > Number(step.number) && "opacity-80",
                      ]
                        .filter(Boolean)
                        .join(" "),
                      title: [
                        "text-lg font-semibold",
                        currentStep > Number(step.number) ? "text-foreground/60" : "text-foreground",
                      ].join(" "),
                      trigger: "px-8 py-4 data-[hover=true]:bg-content2/40 rounded-xl transition-colors",
                      indicator: "text-foreground/40",
                      content: "px-8 py-6",
                    }}
                    isDisabled={index > currentStep - 1}
                    startContent={
                      currentStep > Number(step.number) ? (
                        <CheckCircleIcon />
                      ) : (
                        <CircleWithNumber number={step.number} />
                      )
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
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal isOpen={isSubmitting} steps={statusSteps} />

      {/* Redirect Loading State */}
      <Modal
        hideCloseButton
        classNames={{
          base: "bg-content1/95 backdrop-blur-xl border border-border shadow-2xl",
          body: "p-0",
        }}
        isDismissable={false}
        isOpen={isRedirecting}
        size="sm"
      >
        <ModalContent>
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Spinner color="primary" size="lg" />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Checking Compliance Status</h2>
                <p className="text-foreground/60">Please wait while we verify your account...</p>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </section>
  );
}
