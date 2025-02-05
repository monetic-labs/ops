import { Modal, ModalContent } from "@nextui-org/modal";

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
      isDismissable={false}
      isOpen={isOpen}
      classNames={{
        base: "bg-zinc-900/95 shadow-xl border border-white/10",
        body: "p-0",
      }}
      size="sm"
    >
      <ModalContent>
        <div className="p-8">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-white text-center mb-8">Setting Up Your Account</h2>
            <div className="relative w-full max-w-[320px]">
              {/* Single continuous vertical line */}
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1px] bg-white/10" />
              <div className="space-y-12">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-6">
                      {/* Circle indicator */}
                      <div
                        className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-zinc-900
                        ${
                          step.isComplete
                            ? "bg-success border-success"
                            : index === steps.findIndex((s) => !s.isComplete)
                              ? "border-white animate-pulse"
                              : "border-white/20"
                        }`}
                      >
                        {step.isComplete && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {/* Step message */}
                      <div
                        className={`transition-colors duration-200 flex-1 ${
                          step.isComplete
                            ? "text-success"
                            : index === steps.findIndex((s) => !s.isComplete)
                              ? "text-white"
                              : "text-white/40"
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
