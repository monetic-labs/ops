import { CompanyDetailsStep } from "@/components/onboard/steps/company-details";
import { CompanyAccountStep } from "@/components/onboard/steps/company-account";
import { AccountUsers } from "@/components/onboard/steps/account-users";
import { UserDetailsStep } from "@/components/onboard/steps/user-details";
import { TermsStep } from "@/components/onboard/steps/terms";
import { ReviewStep } from "@/components/onboard/steps/review";
import { StepNavigation } from "../components/StepNavigation";

interface StepConfig {
  number: string;
  title: string;
  content: (props: {
    isValidating: boolean;
    onNext: () => Promise<void>;
    onPrevious?: () => void;
    onStepChange?: (step: number) => void;
    isSubmitting?: boolean;
    isValid?: boolean;
  }) => JSX.Element;
}

export const getSteps = (): StepConfig[] => [
  {
    number: "1",
    title: "Company Account",
    content: ({ isValidating, onNext }) => (
      <>
        <CompanyDetailsStep />
        <StepNavigation isFirstStep isValidating={isValidating} onNext={onNext} />
      </>
    ),
  },
  {
    number: "2",
    title: "Company Details",
    content: ({ isValidating, onNext, onPrevious }) => (
      <>
        <CompanyAccountStep />
        <StepNavigation isValidating={isValidating} onNext={onNext} onPrevious={onPrevious} />
      </>
    ),
  },
  {
    number: "3",
    title: "Account Users",
    content: ({ isValidating, onNext, onPrevious }) => (
      <>
        <AccountUsers />
        <StepNavigation isValidating={isValidating} onNext={onNext} onPrevious={onPrevious} />
      </>
    ),
  },
  {
    number: "4",
    title: "User Details",
    content: ({ isValidating, onNext, onPrevious }) => (
      <>
        <UserDetailsStep />
        <StepNavigation isValidating={isValidating} onNext={onNext} onPrevious={onPrevious} />
      </>
    ),
  },
  {
    number: "5",
    title: "Terms and Conditions",
    content: ({ isValidating, onNext, onPrevious }) => (
      <>
        <TermsStep />
        <StepNavigation isValidating={isValidating} onNext={onNext} onPrevious={onPrevious} />
      </>
    ),
  },
  {
    number: "6",
    title: "Review",
    content: ({ onStepChange, isSubmitting, isValid, onPrevious }) => (
      <>
        <ReviewStep onStepChange={onStepChange!} />
        <StepNavigation isLastStep isSubmitting={isSubmitting} isValid={isValid} onPrevious={onPrevious} />
      </>
    ),
  },
];
