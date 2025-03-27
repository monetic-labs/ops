import { Button } from "@heroui/button";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";

interface StepNavigationProps {
  onNext?: () => Promise<void>;
  onPrevious?: () => void;
  isValidating?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  isValid?: boolean;
  onAddPerson?: () => void;
  showAddPerson?: boolean;
}

export const StepNavigation = ({
  onNext,
  onPrevious,
  isValidating,
  isFirstStep,
  isLastStep,
  isSubmitting,
  isValid,
  onAddPerson,
  showAddPerson,
}: StepNavigationProps) => (
  <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
    {/* Add Person Button - Only shows if showAddPerson is true */}
    {showAddPerson && (
      <Button
        className="w-full md:w-auto bg-content2 text-foreground hover:bg-content3 transition-all group"
        startContent={<Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />}
        variant="flat"
        onClick={onAddPerson}
      >
        Add Another Person
      </Button>
    )}

    {/* Previous Button */}
    {!isFirstStep ? (
      <Button
        className="w-full md:w-auto bg-content2 text-foreground hover:bg-content3 transition-all group order-1 md:order-none"
        startContent={<ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />}
        variant="flat"
        onPress={onPrevious}
      >
        Previous Step
      </Button>
    ) : showAddPerson ? null : (
      (<div className="hidden md:block" />) // Spacer only shown on desktop when no add person button
    )}

    {/* Continue/Complete Button */}
    {!isLastStep ? (
      <Button
        className="w-full md:w-auto bg-primary text-primary-foreground hover:opacity-90 transition-all group order-2 md:order-none"
        endContent={<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        isDisabled={isValidating}
        onPress={onNext}
      >
        Continue
      </Button>
    ) : (
      <Button
        className="w-full md:w-auto bg-primary text-primary-foreground hover:opacity-90 transition-all group order-2 md:order-none"
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
