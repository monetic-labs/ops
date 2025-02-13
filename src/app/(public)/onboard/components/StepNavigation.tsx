import { Button } from "@nextui-org/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface StepNavigationProps {
  onNext?: () => Promise<void>;
  onPrevious?: () => void;
  isValidating?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  isValid?: boolean;
}

export const StepNavigation = ({
  onNext,
  onPrevious,
  isValidating,
  isFirstStep,
  isLastStep,
  isSubmitting,
  isValid,
}: StepNavigationProps) => (
  <div className="mt-8 flex justify-between items-center">
    {!isFirstStep ? (
      <Button
        className="bg-content2 text-foreground hover:bg-content3 transition-all group"
        startContent={<ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />}
        variant="flat"
        onClick={onPrevious}
      >
        Previous Step
      </Button>
    ) : (
      <div /> // Spacer for flex justify-between
    )}
    {!isLastStep ? (
      <Button
        className="bg-primary text-primary-foreground hover:opacity-90 transition-all group"
        endContent={<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        isDisabled={isValidating}
        onClick={onNext}
      >
        Continue
      </Button>
    ) : (
      <Button
        className="bg-primary text-primary-foreground hover:opacity-90 transition-all group"
        endContent={!isSubmitting && <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />}
        isDisabled={isSubmitting || !isValid}
        isLoading={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : "Complete Setup"}
      </Button>
    )}
  </div>
);
