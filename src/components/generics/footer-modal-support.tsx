import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { ModalFooter } from "@nextui-org/modal";
import { Switch } from "@nextui-org/switch";
import html2canvas from "html2canvas";
import SupportChat from "@/components/support/support-chat";

interface ActionButton {
  label: string;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}

interface ModalFooterWithSupportProps {
  actions: ActionButton[];
  onSupportClick: () => void;
  isNewSender?: boolean;
  onNewSenderChange?: (value: boolean) => void;
  captureElementId?: string;
}

export default function ModalFooterWithSupport({
  onSupportClick,
  onNewSenderChange,
  isNewSender,
  actions,
  captureElementId = "root",
}: ModalFooterWithSupportProps) {
  const [showSupportChat, setShowSupportChat] = useState(false);

  const handleSupportClick = async () => {
    try {

      // Add a small delay to ensure all elements are rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      // Capture the entire visible page
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true, // Add this line
        foreignObjectRendering: true, // Add this line
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        onclone: (document) => {
          // This function runs on the cloned document before rendering
          // You can modify elements here if needed
          document.querySelectorAll('img, image').forEach((img) => {
            img.setAttribute('crossorigin', 'anonymous');
          });
        },
      });
      
      // Reduce the image quality and size
      const screenshot = canvas.toDataURL('image/jpeg', 0.5); // Change to JPEG and set quality to 50%

      // Optionally, you can also resize the canvas if needed
      // const resizedCanvas = document.createElement('canvas');
      // const ctx = resizedCanvas.getContext('2d');
      // const scaleFactor = 0.5; // Reduce size by 50%
      // resizedCanvas.width = canvas.width * scaleFactor;
      // resizedCanvas.height = canvas.height * scaleFactor;
      // ctx?.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
      // const resizedScreenshot = resizedCanvas.toDataURL('image/jpeg', 0.5);

      const response = await fetch('/api/support/start-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ screenshot: screenshot }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowSupportChat(true);
      onSupportClick();
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      onSupportClick();
    }
  };

  return (
    <>
      <ModalFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        <Button
          variant="light"
          className="text-notpurple-500 w-2/3 sm:w-auto mx-auto sm:mx-0 order-2 sm:order-none"
          onPress={handleSupportClick}
        >
          Support
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-none">
          {onNewSenderChange && isNewSender !== undefined && (
            <div className="flex flex-row items-center gap-2 justify-between px-2">
              <span className="items-center font-mono">New Sender?</span>
              <Switch
                defaultSelected
                color="secondary"
                aria-label="New Customer"
                isSelected={isNewSender}
                onValueChange={onNewSenderChange}
              />
            </div>
          )}
          {actions.map((action, index) => (
            <Button
              key={index}
              className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto ${action.className || ""}`}
              onPress={action.onClick}
              isLoading={action.isLoading}
              isDisabled={action.isDisabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </ModalFooter>
      {showSupportChat && <SupportChat />}
    </>
  );
}
