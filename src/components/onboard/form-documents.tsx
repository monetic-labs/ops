import React from "react";
import { Button } from "@nextui-org/button";

interface DocumentsProps {
  tosLink: string | null;
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
}

export const Documents: React.FC<DocumentsProps> = ({ tosLink, handleCancel, onSubmitStep, stepCompletion }) => {
  return (
    <>
      <div className="h-96">
        {tosLink ? (
          <iframe className="w-full h-full" src={tosLink} title="Terms of Service" />
        ) : (
          <p>Loading Terms of Service...</p>
        )}
      </div>
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!stepCompletion.step1 || !stepCompletion.step2 || !stepCompletion.step3 ? "button-disabled" : ""}`}
          disabled={!stepCompletion.step1 || !stepCompletion.step2 || !stepCompletion.step3}
          onClick={() => onSubmitStep(4)}
        >
          Step 4: Submit Documents
        </Button>
      </div>
    </>
  );
};
