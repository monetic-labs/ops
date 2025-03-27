import { Modal, ModalContent } from "@heroui/modal";
import { Check } from "lucide-react";

export interface StatusStep {
  message: string;
  isComplete: boolean;
}

interface StatusModalProps {
  isOpen: boolean;
  steps: StatusStep[];
}

export function StatusModal({ isOpen, steps }: StatusModalProps) {
  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-content1/95 backdrop-blur-xl border border-border shadow-2xl",
        body: "p-0",
      }}
      isDismissable={false}
      isOpen={isOpen}
      size="sm"
    >
      <ModalContent>
        <div className="p-8">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-foreground text-center mb-8">Setting Up Your Account</h2>
            <div className="relative w-full max-w-[320px]">
              {/* Single continuous vertical line */}
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1px] bg-border" />
              <div className="space-y-12">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-6">
                      {/* Circle indicator */}
                      <div
                        className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-content1
                        ${
                          step.isComplete
                            ? "bg-primary border-primary"
                            : index === steps.findIndex((s) => !s.isComplete)
                              ? "border-primary animate-pulse"
                              : "border-border"
                        }`}
                      >
                        {step.isComplete && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      {/* Step message */}
                      <div
                        className={`transition-colors duration-200 flex-1 ${
                          step.isComplete
                            ? "text-primary"
                            : index === steps.findIndex((s) => !s.isComplete)
                              ? "text-foreground"
                              : "text-foreground/40"
                        }`}
                      >
                        <span className="text-base">{step.message}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
