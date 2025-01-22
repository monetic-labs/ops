"use client";

import { Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schema, FormData, UserRole } from "@/validations/onboard/schemas";
import { OTP_CODE_LENGTH } from "@/utils/constants";
import pylon from "@/libs/pylon-sdk";
import { ISO3166Alpha2Country, ISO3166Alpha3Country, PersonRole } from "@backpack-fux/pylon-sdk";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { CompanyDetailsStep } from "@/components/onboard/steps/company-details";
import { CompanyAccountStep } from "@/components/onboard/steps/company-account";
import { AccountUsers } from "@/components/onboard/steps/account-users";
import { TermsStep } from "@/components/onboard/steps/terms";
import { ReviewStep } from "@/components/onboard/steps/review";
import { UserDetailsStep } from "@/components/onboard/steps/user-details";
import { OTPModal } from "@/components/generics/otp-modal";
import { getDefaultValues, getFieldsForStep } from "./types";
import { StepNavigation } from "./components/StepNavigation";
import { CircleWithNumber, CheckCircleIcon } from "./components/StepIndicator";
import { useOnboardOTP } from "./hooks/useOnboardOTP";
import { useState } from "react";

export default function OnboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get("email") || "";
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const {
    showOTPModal,
    otp,
    setOTP,
    isOTPLoading,
    otpError,
    canResend,
    resendTimer,
    handleOTPSubmit,
    handleResendOTP,
    initiateOTP,
  } = useOnboardOTP(otpInputRef);

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
          person1.phoneNumber?.number?.length >= 9;

        if (!isValidPerson1) {
          setError("users", {
            type: "required",
            message: "Please fill out all required fields for Person 1",
          });
          return;
        }

        // Check for duplicate emails and phone numbers
        const emails = users.map((user) => user.email);
        const phoneNumbers = users.map((user) => user.phoneNumber?.number).filter(Boolean);

        const hasDuplicateEmails = new Set(emails).size !== emails.length;
        const hasDuplicatePhones = new Set(phoneNumbers).size !== phoneNumbers.length;

        if (hasDuplicateEmails || hasDuplicatePhones) {
          users.forEach((_, index) => {
            if (hasDuplicateEmails) {
              setError(`users.${index}.email`, {
                type: "validate",
                message: "Email address must be unique",
              });
            }
            if (hasDuplicatePhones) {
              setError(`users.${index}.phoneNumber`, {
                type: "validate",
                message: "Phone number must be unique",
              });
            }
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

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const response = await pylon.createMerchant({
        settlementAddress: data.settlementAddress,
        isTermsOfServiceAccepted: data.acceptedTerms,
        company: {
          name: data.companyName,
          email: data.companyEmail,
          website: `https://${data.companyWebsite}`,
          type: data.companyType,
          registrationNumber: data.companyRegistrationNumber,
          taxId: data.companyTaxId,
          description: data.companyDescription || undefined,
          registeredAddress: {
            street1: data.streetAddress1,
            street2: data.streetAddress2 || undefined,
            city: data.city,
            postcode: data.postcode,
            state: data.state,
            country: ISO3166Alpha2Country.US,
          },
          controlOwner: {
            firstName: data.users[0].firstName,
            lastName: data.users[0].lastName,
            email: data.users[0].email,
            phoneCountryCode: data.users[0].phoneNumber.extension,
            phoneNumber: data.users[0].phoneNumber.number,
            nationalId: data.users[0].socialSecurityNumber,
            countryOfIssue: data.users[0].countryOfIssue,
            birthDate: data.users[0].birthDate,
            walletAddress: data.settlementAddress,
            address: {
              line1: data.users[0].streetAddress1,
              line2: data.users[0].streetAddress2 || undefined,
              city: data.users[0].city,
              region: data.users[0].state,
              postalCode: data.users[0].postcode,
              countryCode: ISO3166Alpha2Country.US,
              country: ISO3166Alpha3Country.USA,
            },
          },
          ultimateBeneficialOwners: data.users
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
          representatives: data.users
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
        users: data.users
          .filter((user) => user.hasDashboardAccess)
          .map((user) => {
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
              role,
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

      if (response) {
        const controlOwnerEmail = data.users[0].email;
        await initiateOTP(controlOwnerEmail);
      }
    } catch (error: any) {
      console.error("error: ", error);
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key as any, {
            type: "required",
            message: value as string,
          });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  });

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
          <ReviewStep onStepChange={() => handleNext()} />
          <StepNavigation onPrevious={handlePrevious} isLastStep isSubmitting={isSubmitting} isValid={isValid} />
        </>
      ),
    },
  ];

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
                  {step.content}
                </AccordionItem>
              ))}
            </Accordion>

            <OTPModal
              isOpen={showOTPModal}
              email={email}
              otp={otp}
              otpError={otpError}
              isLoading={isOTPLoading}
              canResend={canResend}
              resendTimer={resendTimer}
              shouldEnableTimer={true}
              otpInputRef={otpInputRef}
              onOTPChange={(e) => setOTP(e.target.value)}
              onOTPComplete={() =>
                handleOTPSubmit(watch("users.0.email")).then((success) => {
                  if (success) router.refresh();
                })
              }
              onResend={() => handleResendOTP(watch("users.0.email"))}
              onValueChange={(value) => setOTP(value)}
            />
          </form>
        </FormProvider>
      </Suspense>
    </section>
  );
}
