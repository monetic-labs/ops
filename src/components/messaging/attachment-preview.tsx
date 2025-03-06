import React from "react";
import { Button } from "@nextui-org/button";
import { Image } from "@nextui-org/image";
import { Spinner } from "@nextui-org/spinner";
import { X } from "lucide-react";

interface AttachmentPreviewProps {
  attachment: {
    isLoading?: boolean;
    previewUrl?: string;
    name?: string;
  } | null;
  onClear: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onClear }) => {
  if (!attachment) return null;

  return (
    <div className="px-2 py-1">
      <div className="flex items-center gap-2 bg-content3/20 rounded-lg p-2 pr-3">
        {attachment.isLoading ? (
          <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : attachment.previewUrl ? (
          <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0">
            <Image src={attachment.previewUrl} alt="Preview" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span className="text-xs text-foreground/90 truncate">
            {attachment.isLoading ? "Loading..." : attachment.name || "Attachment"}
          </span>
        </div>
        <Button isIconOnly size="sm" variant="light" className="text-foreground/80 ml-auto" onPress={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
