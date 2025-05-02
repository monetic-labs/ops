"use client";

import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "@/hooks/generics/useTheme";

interface QRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  qrCodeUrl: string | null;
}

export const QRCodeModal = ({ isOpen, onOpenChange, qrCodeUrl }: QRCodeModalProps) => {
  const { isDark } = useTheme();

  const qrFgColor = isDark ? "#FFFFFF" : "#000000";
  const qrBgColor = isDark ? "#18181b" : "#FFFFFF";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Payment Request QR Code</ModalHeader>
            <ModalBody className="flex flex-col justify-center items-center py-6 gap-4">
              {qrCodeUrl ? (
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={256}
                  level="H"
                  marginSize={4}
                  bgColor={qrBgColor}
                  fgColor={qrFgColor}
                />
              ) : (
                <p className="text-danger">Error: No URL provided for QR code.</p>
              )}
              <p className="text-sm text-foreground/70 text-center max-w-xs">
                Show this QR code to customers in-store. They can scan it using{" "}
                <span className="font-bold">Monetic Pay</span> to complete the payment instantly over the counter.
              </p>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
