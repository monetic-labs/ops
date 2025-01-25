import { Button } from "@nextui-org/button";

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
  <div className="mt-8 flex justify-end space-x-4">
    {!isFirstStep && (
      <Button
        className="border-ualert-500 text-notpurple-500 hover:bg-ualert-500/10"
        variant="bordered"
        onClick={onPrevious}
      >
        Previous
      </Button>
    )}
    {!isLastStep ? (
      <Button
        className="bg-ualert-500 text-notpurple-500 hover:bg-ualert-600"
        color="default"
        isDisabled={isValidating}
        onClick={onNext}
      >
        Next
      </Button>
    ) : (
      <Button
        className="bg-ualert-500 text-notpurple-500 hover:bg-ualert-600"
        color="default"
        isDisabled={isSubmitting || !isValid}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </Button>
    )}
  </div>
);
