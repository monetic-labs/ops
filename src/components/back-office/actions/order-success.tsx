import React, { useEffect } from "react";
import { Modal, ModalContent } from "@nextui-org/modal";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface RefundSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  fadeOutOpts: {
    autoFadeOut?: boolean;
    fadeoutTime?: number;
  };
}

export function RefundSuccessModal({
  isOpen,
  onClose,
  title,
  message,
  fadeOutOpts: { autoFadeOut = false, fadeoutTime = 3000 },
}: RefundSuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoFadeOut) {
      const timer = setTimeout(() => {
        onClose();
      }, fadeoutTime);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoFadeOut, fadeoutTime]);

  return (
    <>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <Modal
            classNames={{
              base: "bg-background",
              header: "border-b-[1px] border-default-200",
              footer: "border-t-[1px] border-default-200",
              closeButton: "hover:bg-white/5 active:bg-white/10",
            }}
            isOpen={isOpen}
            size="sm"
            onClose={onClose}
          >
            <ModalContent>
              {() => (
                <div className="flex flex-col items-center justify-center p-6">
                  <motion.div
                    animate={{ scale: 1 }}
                    initial={{ scale: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  </motion.div>
                  <motion.h2
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-2xl font-bold text-foreground mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {title}
                  </motion.h2>
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-foreground-500"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {message}
                  </motion.p>
                </div>
              )}
            </ModalContent>
          </Modal>
        </motion.div>
      )}
    </>
  );
}
