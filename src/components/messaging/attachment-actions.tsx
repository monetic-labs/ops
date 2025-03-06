import React from "react";
import { Button } from "@nextui-org/button";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Paperclip, Image as ImageIcon, Camera } from "lucide-react";

interface AttachmentActionsProps {
  isDisabled: boolean;
  onUploadClick: () => void;
  onScreenshotClick: () => void;
}

export const AttachmentActions: React.FC<AttachmentActionsProps> = ({
  isDisabled,
  onUploadClick,
  onScreenshotClick,
}) => {
  return (
    <Popover placement="top">
      <PopoverTrigger>
        <Button isIconOnly size="sm" variant="light" className="text-foreground/80" isDisabled={isDisabled}>
          <Paperclip className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2 w-full min-w-[160px]">
          <div className="flex flex-col gap-2">
            <Button
              startContent={<ImageIcon className="w-4 h-4" />}
              variant="light"
              className="justify-start"
              onPress={onUploadClick}
              isDisabled={isDisabled}
            >
              Upload Image
            </Button>
            <Button
              startContent={<Camera className="w-4 h-4" />}
              variant="light"
              className="justify-start"
              onPress={onScreenshotClick}
              isDisabled={isDisabled}
            >
              Take Screenshot
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
